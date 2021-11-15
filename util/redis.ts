import { WrappedNodeRedisClient, createNodeRedisClient } from 'handy-redis';

let redisClient: WrappedNodeRedisClient = initRedis();

function initRedis() {
    console.log('Redis: connecting');
    const client = createNodeRedisClient({
        url: process.env.REDIS_URL,
        max_attempts: 3,
        retry_max_delay: 2000,
    });

    client.nodeRedis.on('error', (err) => {
        console.log('Redis Client Error', err);
        // try reconnection after 10 sec
        setTimeout(() => {
            redisClient = initRedis();
        }, 10000);
    });

    return client;
}

export const getRedisClient = (): WrappedNodeRedisClient => {
    return redisClient;
}

export const getCacheFromRedis = async (
    cacheKey: string,
    checkForTime = true,
    cacheTime = 1800,
) => {
    try {
        const cache = await redisClient.get(cacheKey);
        if (cache) {
            const now = Date.now();
            const cacheObj = JSON.parse(cache);
            // we don't use redis.expire because it deletes the key when expired, we want to be able to get data in case of error
            if (!checkForTime || ((now - cacheObj?.timestamp) / 1000 < cacheTime)) {
                return cacheObj.data;
            }
        }
    } catch(e) {
        console.log(e);
    }
    return undefined;
}

export const redisSetWithTimestamp = async (key: string, data: any) => {
    try {
        return await redisClient.set(key, JSON.stringify({ timestamp: Date.now(), data }));
    } catch(e) {
        console.log(e);
        return
    }
}