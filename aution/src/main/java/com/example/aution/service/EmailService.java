package com.example.aution.service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.aution.entity.AuctionDetailsEntity;
import com.example.aution.entity.AuctionerEntity;
import com.example.aution.entity.BidderEntity;
import com.example.aution.entity.PersonDetails;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * EmailService handles three scenarios at auction completion:
 *
 *  1. Winner exists:
 *     - Email to AUCTIONEER: winner's contact details
 *     - Email to BIDDER (winner): auctioneer's contact details
 *
 *  2. No winner (no bids placed):
 *     - Email to AUCTIONEER: no participant notification
 *
 * All emails are sent @Async so they never block the auction
 * completion flow — finalization completes instantly regardless
 * of email delivery speed.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    // ── Winner notification to Auctioneer ─────────────────────────────────────

    /**
     * Sends winner's contact details to the auctioneer.
     * Called after auction completes with a winning bid.
     */
    @Async
    public void sendWinnerDetailsToAuctioneer(
            AuctionDetailsEntity auction,
            BidderEntity winner,
            BigDecimal winningBid) {

        PersonDetails auctioneerPerson = auction.getAuctioner().getPersonDetails();
        PersonDetails winnerPerson = winner.getPersonDetails();
        String itemName = auction.getItemDetails().getName();

        String subject = "🏆 Auction Ended — Winner Found | " + itemName;

        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">

                  <div style="background-color: #1a1a2e; padding: 24px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: #e0e0e0; margin: 0;">🏆 Auction Completed</h2>
                    <p style="color: #a0a0b0; margin: 4px 0 0 0;">Your item has been sold!</p>
                  </div>

                  <div style="background-color: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0;">

                    <h3 style="color: #1a1a2e;">Auction Summary</h3>
                    <table style="width: 100%%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px; color: #666;">Item</td>
                        <td style="padding: 8px; font-weight: bold;">%s</td>
                      </tr>
                      <tr style="background: #f0f0f0;">
                        <td style="padding: 8px; color: #666;">Winning Bid</td>
                        <td style="padding: 8px; font-weight: bold; color: #2e7d32;">₹%s</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px; color: #666;">Auction Ended</td>
                        <td style="padding: 8px;">%s</td>
                      </tr>
                    </table>

                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

                    <h3 style="color: #1a1a2e;">Winner Contact Details</h3>
                    <table style="width: 100%%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px; color: #666;">Name</td>
                        <td style="padding: 8px; font-weight: bold;">%s %s</td>
                      </tr>
                      <tr style="background: #f0f0f0;">
                        <td style="padding: 8px; color: #666;">Email</td>
                        <td style="padding: 8px;"><a href="mailto:%s">%s</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px; color: #666;">Phone</td>
                        <td style="padding: 8px;">%s</td>
                      </tr>
                      <tr style="background: #f0f0f0;">
                        <td style="padding: 8px; color: #666;">Username</td>
                        <td style="padding: 8px;">%s</td>
                      </tr>
                    </table>

                    <p style="margin-top: 24px; color: #666; font-size: 13px;">
                      Please contact the winner within 48 hours to arrange payment and delivery.
                    </p>

                  </div>

                  <div style="background-color: #1a1a2e; padding: 12px 24px; border-radius: 0 0 8px 8px;">
                    <p style="color: #a0a0b0; font-size: 12px; margin: 0;">
                      Auction Platform — Automated Notification
                    </p>
                  </div>

                </body>
                </html>
                """.formatted(
                itemName,
                winningBid.toPlainString(),
                auction.getEndTime().format(FORMATTER),
                winnerPerson.getFirstName(), winnerPerson.getLastName(),
                winnerPerson.getEmail(), winnerPerson.getEmail(),
                winnerPerson.getPhoneNumber() != null ? winnerPerson.getPhoneNumber() : "Not provided",
                winnerPerson.getUsername()
        );

        sendEmail(auctioneerPerson.getEmail(), subject, body);
        log.info("Winner details email sent to auctioneer [{}] for auction [id={}]",
                auctioneerPerson.getEmail(), auction.getId());
    }

    // ── Auctioneer details to Winner Bidder ───────────────────────────────────

    /**
     * Sends auctioneer's contact details to the winning bidder.
     * Called after auction completes with a winning bid.
     */
    @Async
    public void sendAuctioneerDetailsToWinner(
            AuctionDetailsEntity auction,
            BidderEntity winner,
            BigDecimal winningBid) {

        PersonDetails winnerPerson = winner.getPersonDetails();
        AuctionerEntity auctioner = auction.getAuctioner();
        PersonDetails auctioneerPerson = auctioner.getPersonDetails();
        String itemName = auction.getItemDetails().getName();

        String subject = "🎉 Congratulations! You Won | " + itemName;

        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">

                  <div style="background-color: #1a1a2e; padding: 24px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: #e0e0e0; margin: 0;">🎉 Congratulations, %s!</h2>
                    <p style="color: #a0a0b0; margin: 4px 0 0 0;">You have won the auction!</p>
                  </div>

                  <div style="background-color: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0;">

                    <h3 style="color: #1a1a2e;">Your Winning Summary</h3>
                    <table style="width: 100%%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px; color: #666;">Item Won</td>
                        <td style="padding: 8px; font-weight: bold;">%s</td>
                      </tr>
                      <tr style="background: #f0f0f0;">
                        <td style="padding: 8px; color: #666;">Your Winning Bid</td>
                        <td style="padding: 8px; font-weight: bold; color: #2e7d32;">₹%s</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px; color: #666;">Auction Ended</td>
                        <td style="padding: 8px;">%s</td>
                      </tr>
                    </table>

                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

                    <h3 style="color: #1a1a2e;">Auctioneer Contact Details</h3>
                    <p style="color: #666; font-size: 13px;">
                      Please contact the auctioneer to arrange payment and delivery of your item.
                    </p>
                    <table style="width: 100%%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px; color: #666;">Name</td>
                        <td style="padding: 8px; font-weight: bold;">%s %s</td>
                      </tr>
                      <tr style="background: #f0f0f0;">
                        <td style="padding: 8px; color: #666;">Company</td>
                        <td style="padding: 8px;">%s</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px; color: #666;">Email</td>
                        <td style="padding: 8px;"><a href="mailto:%s">%s</a></td>
                      </tr>
                      <tr style="background: #f0f0f0;">
                        <td style="padding: 8px; color: #666;">Phone</td>
                        <td style="padding: 8px;">%s</td>
                      </tr>
                    </table>

                    <p style="margin-top: 24px; color: #666; font-size: 13px;">
                      The auctioneer will contact you within 48 hours.
                      Please be ready with your payment details.
                    </p>

                  </div>

                  <div style="background-color: #1a1a2e; padding: 12px 24px; border-radius: 0 8px 8px 0;">
                    <p style="color: #a0a0b0; font-size: 12px; margin: 0;">
                      Auction Platform — Automated Notification
                    </p>
                  </div>

                </body>
                </html>
                """.formatted(
                winnerPerson.getFirstName(),
                itemName,
                winningBid.toPlainString(),
                auction.getEndTime().format(FORMATTER),
                auctioneerPerson.getFirstName(), auctioneerPerson.getLastName(),
                auctioner.getCompanyName() != null ? auctioner.getCompanyName() : "Independent",
                auctioneerPerson.getEmail(), auctioneerPerson.getEmail(),
                auctioneerPerson.getPhoneNumber() != null
                        ? auctioneerPerson.getPhoneNumber() : "Not provided"
        );

        sendEmail(winnerPerson.getEmail(), subject, body);
        log.info("Auctioneer details email sent to winner [{}] for auction [id={}]",
                winnerPerson.getEmail(), auction.getId());
    }

    // ── No Participant notification to Auctioneer ─────────────────────────────

    /**
     * Sent to auctioneer when auction ends with zero bids.
     */
    @Async
    public void sendNoParticipantEmail(AuctionDetailsEntity auction) {

        PersonDetails auctioneerPerson = auction.getAuctioner().getPersonDetails();
        String itemName = auction.getItemDetails().getName();

        String subject = "📭 Auction Ended — No Participants | " + itemName;

        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">

                  <div style="background-color: #1a1a2e; padding: 24px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: #e0e0e0; margin: 0;">📭 Auction Ended</h2>
                    <p style="color: #a0a0b0; margin: 4px 0 0 0;">No bids were placed on your item.</p>
                  </div>

                  <div style="background-color: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0;">

                    <h3 style="color: #1a1a2e;">Auction Summary</h3>
                    <table style="width: 100%%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px; color: #666;">Item</td>
                        <td style="padding: 8px; font-weight: bold;">%s</td>
                      </tr>
                      <tr style="background: #f0f0f0;">
                        <td style="padding: 8px; color: #666;">Starting Price</td>
                        <td style="padding: 8px;">₹%s</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px; color: #666;">Started At</td>
                        <td style="padding: 8px;">%s</td>
                      </tr>
                      <tr style="background: #f0f0f0;">
                        <td style="padding: 8px; color: #666;">Ended At</td>
                        <td style="padding: 8px;">%s</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px; color: #666;">Result</td>
                        <td style="padding: 8px; color: #c62828; font-weight: bold;">
                          No bids placed — Item unsold
                        </td>
                      </tr>
                    </table>

                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

                    <h3 style="color: #1a1a2e;">What you can do next</h3>
                    <ul style="color: #555; line-height: 1.8;">
                      <li>Re-list the item with a lower starting price</li>
                      <li>Adjust the reserve price to attract more bidders</li>
                      <li>Schedule the auction at a different time</li>
                    </ul>

                  </div>

                  <div style="background-color: #1a1a2e; padding: 12px 24px; border-radius: 0 0 8px 8px;">
                    <p style="color: #a0a0b0; font-size: 12px; margin: 0;">
                      Auction Platform — Automated Notification
                    </p>
                  </div>

                </body>
                </html>
                """.formatted(
                itemName,
                auction.getStartingPrice().toPlainString(),
                auction.getStartTime().format(FORMATTER),
                auction.getEndTime().format(FORMATTER)
        );

        sendEmail(auctioneerPerson.getEmail(), subject, body);
        log.info("No-participant email sent to auctioneer [{}] for auction [id={}]",
                auctioneerPerson.getEmail(), auction.getId());
    }

    // ── Private helper ────────────────────────────────────────────────────────

    private void sendEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML
            helper.setFrom("Auction Platform <tholkappiyan.vst@gmail.com>");
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send email to [{}]: {}", to, e.getMessage());
        }
    }
}