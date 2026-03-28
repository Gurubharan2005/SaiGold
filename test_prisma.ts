import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()

try {
  let url = process.env.DATABASE_URL
  if (url && url.startsWith('prisma+postgres://')) {
     const match = url.match(/localhost:(\d+)/);
     if (match) {
        url = `postgres://postgres:postgres@localhost:${parseInt(match[1]) + 1}/template1?sslmode=disable`;
     }
  }
  console.log("Using URL:", url)
  const prisma = new PrismaClient({
     datasourceUrl: url
  })
  console.log("Success!")
} catch (e) {
  console.error("FAIL", e)
}
