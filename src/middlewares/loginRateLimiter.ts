// import { RequestHandler } from "express";

// interface FailedLoginAttempts {
//     [key: string]: {
//       attempts: number;
//       lastAttempt: Date;
//     };
//   }

// export const loginRateLimiter: RequestHandler = (req,res,next) => {
//     const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
//   const currentTime = new Date().getTime();

//   if (ip && failedLoginAttempts[ip]) {
//     const { attempts, lastAttempt } = failedLoginAttempts[ip];

//     if (currentTime - lastAttempt.getTime() < BLOCK_DURATION && attempts >= MAX_ATTEMPTS) {
//       return res.status(429).send('Terlalu banyak percobaan login yang gagal, coba lagi setelah 15 menit');
//     }

//     if (currentTime - lastAttempt.getTime() >= BLOCK_DURATION) {
//       failedLoginAttempts[ip].attempts = 0; // Reset attempts setelah durasi block berlalu
//     }
//   }

//   next();
// }
