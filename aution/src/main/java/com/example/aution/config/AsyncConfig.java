package com.example.aution.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * AsyncConfig enables @Async annotation support.
 *
 * Without this, @Async on EmailService methods is silently ignored
 * and emails block the auction finalization thread.
 *
 * The thread pool is configured specifically for email tasks:
 *  - corePoolSize 2: always 2 threads ready for emails
 *  - maxPoolSize 5: can spike to 5 if many auctions end simultaneously
 *  - queueCapacity 10: buffer for email tasks waiting for a thread
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "emailTaskExecutor")
    public Executor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(10);
        executor.setThreadNamePrefix("email-");
        executor.initialize();
        return executor;
    }
}