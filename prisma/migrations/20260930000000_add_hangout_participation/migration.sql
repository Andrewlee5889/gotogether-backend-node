CREATE TYPE "JoinPolicy" AS ENUM ('OPEN', 'APPROVAL', 'INVITE_ONLY');
CREATE TYPE "ParticipationStatus" AS ENUM ('PENDING', 'JOINED', 'DECLINED');

ALTER TABLE "Hangout"
ADD COLUMN "joinPolicy" "JoinPolicy" NOT NULL DEFAULT 'APPROVAL';

CREATE TABLE "HangoutParticipant" (
    "hangoutId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HangoutParticipant_pkey" PRIMARY KEY ("hangoutId", "userId")
);

CREATE INDEX "HangoutParticipant_userId_status_idx"
ON "HangoutParticipant"("userId", "status");

ALTER TABLE "HangoutParticipant" ADD CONSTRAINT "HangoutParticipant_hangoutId_fkey"
FOREIGN KEY ("hangoutId") REFERENCES "Hangout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HangoutParticipant" ADD CONSTRAINT "HangoutParticipant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
