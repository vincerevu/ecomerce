package com.project.ecommerce.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(redisJsonSerializer());
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        GenericJackson2JsonRedisSerializer redisJsonSerializer = redisJsonSerializer();
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(redisJsonSerializer))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> configurations = new HashMap<>();

        // Phase 1: Content Module (24h TTL)
        configurations.put("banners", defaultConfig.entryTtl(Duration.ofDays(1)));
        configurations.put("settings", defaultConfig.entryTtl(Duration.ofDays(1)));

        // Phase 2: Product Module (12h - 30m TTL)
        configurations.put("categories", defaultConfig.entryTtl(Duration.ofHours(12)));
        configurations.put("tags", defaultConfig.entryTtl(Duration.ofHours(12)));
        configurations.put("collections", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        configurations.put("collection_showcases", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        configurations.put("shipping_locations", defaultConfig.entryTtl(Duration.ofDays(7)));
        configurations.put("shipping_services", defaultConfig.entryTtl(Duration.ofHours(6)));
        configurations.put("roles", defaultConfig.entryTtl(Duration.ofHours(12)));
        configurations.put("permissions", defaultConfig.entryTtl(Duration.ofHours(12)));
        configurations.put("membership_tiers", defaultConfig.entryTtl(Duration.ofHours(12)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(configurations)
                .build();
    }

    private GenericJackson2JsonRedisSerializer redisJsonSerializer() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.activateDefaultTypingAsProperty(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.EVERYTHING,
                "@class");
        GenericJackson2JsonRedisSerializer.registerNullValueSerializer(objectMapper, "@class");
        return new GenericJackson2JsonRedisSerializer(objectMapper);
    }
}
