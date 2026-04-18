-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('QUEUING_SOON', 'NOW_QUEUING', 'ON_DECK', 'ON_FIELD');

-- CreateEnum
CREATE TYPE "WebcastType" AS ENUM ('TWITCH', 'YOUTUBE');

-- CreateTable
CREATE TABLE "Webcast" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "WebcastType" NOT NULL,
    "channel" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "eventId" UUID NOT NULL,

    CONSTRAINT "Webcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "MatchStatus" NOT NULL DEFAULT 'QUEUING_SOON',
    "eventId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "teams" INTEGER[],
    "blue_score" DOUBLE PRECISION NOT NULL,
    "red_score" DOUBLE PRECISION NOT NULL,
    "asOfTime" TIMESTAMP(3) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationKey" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,

    CONSTRAINT "VerificationKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_key_key" ON "Event"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Match_key_key" ON "Match"("key");

-- AddForeignKey
ALTER TABLE "Webcast" ADD CONSTRAINT "Webcast_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
