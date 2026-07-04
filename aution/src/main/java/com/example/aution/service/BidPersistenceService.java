package com.example.aution.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.aution.entity.AuctionDetailsEntity;
import com.example.aution.entity.AuctionStatus;
import com.example.aution.entity.BidHistoryEntity;
import com.example.aution.repository.AuctionRepository;
import com.example.aution.repository.BidHistoryRepository;
import com.example.aution.repository.BidderRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BidPersistenceService {

    private final RedisTemplate<String, String> redisTemplate;
    private final BidHistoryRepository bidHistoryRepository;
    private final AuctionRepository auctionRepository;
    private final BidderRepository bidderRepository;
    private final EmailService emailService; // ← injected for notifications

    private static final int DRAIN_BATCH_SIZE = 100;

    // ── Periodic drain (every 5 seconds) ─────────────────────────────────────

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void drainBidQueues() {
        List<AuctionDetailsEntity> activeAuctions = auctionRepository
                .findByStatusAndStartTimeBefore(AuctionStatus.ACTIVE,
                        LocalDateTime.now().plusYears(1));

        if (activeAuctions.isEmpty()) return;

        List<BidHistoryEntity> batch = new ArrayList<>();

        for (AuctionDetailsEntity auction : activeAuctions) {
            String queueKey = BidService.keyQueue(auction.getId());

            for (int i = 0; i < DRAIN_BATCH_SIZE; i++) {
                String entry = redisTemplate.opsForList().rightPop(queueKey);
                if (entry == null) break;
                BidHistoryEntity bidRecord = parseBidEntry(entry, auction);
                if (bidRecord != null) batch.add(bidRecord);
            }
        }

        if (!batch.isEmpty()) {
            bidHistoryRepository.saveAll(batch);
            log.info("Drained {} bids from Redis queues to PostgreSQL", batch.size());
        }
    }

    // ── Final drain after auction completes ───────────────────────────────────

    @Transactional
    public void finalDrain(AuctionDetailsEntity auction) {
        String queueKey    = BidService.keyQueue(auction.getId());
        String highestBidKey = BidService.keyHighestBid(auction.getId());
        String leaderKey   = BidService.keyLeader(auction.getId());

        // Drain remaining bids
        List<BidHistoryEntity> remaining = new ArrayList<>();
        String entry;
        while ((entry = redisTemplate.opsForList().rightPop(queueKey)) != null) {
            BidHistoryEntity record = parseBidEntry(entry, auction);
            if (record != null) remaining.add(record);
        }
        if (!remaining.isEmpty()) bidHistoryRepository.saveAll(remaining);

        // Resolve winner
        String winnerUsername = redisTemplate.opsForValue().get(leaderKey);
        String highestBid     = redisTemplate.opsForValue().get(highestBidKey);

        if (winnerUsername != null && !winnerUsername.isEmpty()) {
            // ── Winner exists ─────────────────────────────────────────────────
            bidderRepository.findByPersonDetailsUsername(winnerUsername).ifPresent(winner -> {
                BigDecimal winningBid = new BigDecimal(highestBid);

                auction.setWinningBidder(winner);
                auction.setCurrentHighestBid(winningBid);
                auction.setFinalizedAt(LocalDateTime.now());
                auctionRepository.save(auction);

                log.info("Auction [id={}] won by [{}] at ₹{}",
                        auction.getId(), winnerUsername, highestBid);

                // Send emails — @Async so they don't block finalization
                emailService.sendWinnerDetailsToAuctioneer(auction, winner, winningBid);
                emailService.sendAuctioneerDetailsToWinner(auction, winner, winningBid);
            });

        } else {
            // ── No bids placed ────────────────────────────────────────────────
            auction.setFinalizedAt(LocalDateTime.now());
            auctionRepository.save(auction);

            log.info("Auction [id={}] completed with no bids", auction.getId());

            // Send no-participant email to auctioneer
            emailService.sendNoParticipantEmail(auction);
        }

        // Clean up Redis keys
        redisTemplate.delete(List.of(
                BidService.keyStatus(auction.getId()),
                BidService.keyHighestBid(auction.getId()),
                BidService.keyLeader(auction.getId()),
                BidService.keyIncrement(auction.getId()),
                BidService.keyQueue(auction.getId()),
                BidService.keyPubSub(auction.getId())
        ));

        log.info("Redis keys cleaned up for auction [id={}]", auction.getId());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private BidHistoryEntity parseBidEntry(
            String entry, AuctionDetailsEntity auction) {
        try {
            String[] parts = entry.split(":", 3);
            if (parts.length != 3) {
                log.warn("Malformed bid queue entry: {}", entry);
                return null;
            }

            BigDecimal amount  = new BigDecimal(parts[0]);
            String username    = parts[1];
            long timestamp     = Long.parseLong(parts[2]);

            LocalDateTime placedAt = LocalDateTime.ofInstant(
                    Instant.ofEpochMilli(timestamp), ZoneId.systemDefault());

            return bidderRepository.findByPersonDetailsUsername(username)
                    .map(bidder -> BidHistoryEntity.builder()
                            .auction(auction)
                            .bidder(bidder)
                            .bidAmount(amount)
                            .placedAt(placedAt)
                            .isValid(true)
                            .build())
                    .orElse(null);

        } catch (Exception e) {
            log.error("Failed to parse bid entry [{}]: {}", entry, e.getMessage());
            return null;
        }
    }
}