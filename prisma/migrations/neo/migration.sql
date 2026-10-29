-- Complete neo baseline. Existing databases verify structure before resolving it.
BEGIN;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "neo";

-- CreateEnum
CREATE TYPE "neo"."ResourceType" AS ENUM ('books', 'notes', 'papers', 'practical', 'questions', 'syllabus', 'videos', 'viva');

-- CreateEnum
CREATE TYPE "neo"."UserRole" AS ENUM ('STUDENT', 'ADMIN', 'SUPERADMIN', 'TEACHER', 'CONTENT_MANAGER');

-- CreateEnum
CREATE TYPE "neo"."ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "neo"."ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "neo"."AdminRole" AS ENUM ('OWNER', 'EDITOR', 'SUPPORT');

-- CreateTable
CREATE TABLE "neo"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "neo"."UserRole" NOT NULL DEFAULT 'STUDENT',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "semester" INTEGER,
    "site" TEXT NOT NULL DEFAULT 'neocsit',
    "avatarUrl" TEXT,
    "phone" TEXT,
    "jobTitle" TEXT DEFAULT 'Student',
    "emergencyLockdown" BOOLEAN NOT NULL DEFAULT false,
    "college" TEXT,
    "studentId" TEXT,
    "bio" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "devicePolicy" TEXT NOT NULL DEFAULT '1_web_1_app',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."SuperAdminAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "ipAddress" TEXT NOT NULL DEFAULT 'Not collected',
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperAdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."Semester" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isElective" BOOLEAN NOT NULL DEFAULT false,
    "electiveGroup" TEXT,
    "semesterId" INTEGER,
    "courseId" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "creditHours" INTEGER NOT NULL DEFAULT 3,
    "lectureHours" INTEGER NOT NULL DEFAULT 0,
    "status" "neo"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."Resource" (
    "unitId" TEXT,
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "neo"."ResourceType" NOT NULL,
    "author" TEXT,
    "subjectId" TEXT NOT NULL,
    "status" "neo"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."SiteConfig" (
    "id" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "allowRegistration" BOOLEAN NOT NULL DEFAULT true,
    "announcement" TEXT,
    "logoUrl" TEXT DEFAULT '/logo.png',
    "domainUrl" TEXT,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Guides',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "author" TEXT NOT NULL DEFAULT 'Aashish Adhikari',
    "authorAvatar" TEXT,
    "status" "neo"."ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "site" TEXT NOT NULL DEFAULT 'all',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "readTime" INTEGER NOT NULL DEFAULT 3,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."AcademicSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."AcademicOtp" (
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "challengeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "course" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "AcademicOtp_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "neo"."AcademicRateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "neo"."PlatformObject" (
    "key" TEXT NOT NULL,
    "body" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformObject_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "neo"."University" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "faculty" TEXT NOT NULL DEFAULT '',
    "totalSemesters" INTEGER NOT NULL DEFAULT 8,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "universityId" TEXT NOT NULL,
    "status" "neo"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."Unit" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "hours" INTEGER NOT NULL DEFAULT 0,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "neo"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."Question" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "answer" TEXT NOT NULL DEFAULT '',
    "year" INTEGER,
    "marks" INTEGER NOT NULL DEFAULT 0,
    "status" "neo"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "targetSemesters" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "status" "neo"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "showInTicker" BOOLEAN NOT NULL DEFAULT false,
    "externalLink" TEXT,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."AdminAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "totpSecretEncrypted" TEXT NOT NULL,
    "lastTotpStep" INTEGER NOT NULL DEFAULT 0,
    "role" "neo"."AdminRole" NOT NULL DEFAULT 'EDITOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."AdminSession" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."StudentEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."StudentElective" (
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentElective_pkey" PRIMARY KEY ("userId","subjectId")
);

-- CreateTable
CREATE TABLE "neo"."SitePageView" (
    "id" TEXT NOT NULL,
    "visitor" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'Direct',
    "device" TEXT NOT NULL DEFAULT 'Desktop',
    "browser" TEXT NOT NULL DEFAULT 'Other',
    "clientType" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SitePageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neo"."SitePWAEvent" (
    "id" TEXT NOT NULL,
    "visitor" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "clientType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SitePWAEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_site_key" ON "neo"."User"("email", "site");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_slug_key" ON "neo"."Subject"("slug");

-- CreateIndex
CREATE INDEX "Subject_courseId_semesterId_status_idx" ON "neo"."Subject"("courseId", "semesterId", "status");

-- CreateIndex
CREATE INDEX "Resource_unitId_idx" ON "neo"."Resource"("unitId");

-- CreateIndex
CREATE INDEX "Resource_subjectId_status_type_idx" ON "neo"."Resource"("subjectId", "status", "type");

-- CreateIndex
CREATE UNIQUE INDEX "SiteConfig_site_key" ON "neo"."SiteConfig"("site");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "neo"."Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSession_tokenHash_key" ON "neo"."AcademicSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AcademicSession_userId_idx" ON "neo"."AcademicSession"("userId");

-- CreateIndex
CREATE INDEX "AcademicSession_expiresAt_idx" ON "neo"."AcademicSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AcademicRateLimit_expiresAt_idx" ON "neo"."AcademicRateLimit"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "University_slug_key" ON "neo"."University"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "neo"."Course"("slug");

-- CreateIndex
CREATE INDEX "Course_universityId_status_idx" ON "neo"."Course"("universityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_subjectId_number_key" ON "neo"."Unit"("subjectId", "number");

-- CreateIndex
CREATE INDEX "Question_subjectId_status_year_idx" ON "neo"."Question"("subjectId", "status", "year");

-- CreateIndex
CREATE INDEX "Notice_status_publishedAt_idx" ON "neo"."Notice"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminAccount_email_key" ON "neo"."AdminAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "neo"."AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_adminId_idx" ON "neo"."AdminSession"("adminId");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "neo"."AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "neo"."AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entity_entityId_idx" ON "neo"."AdminAuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_courseId_semester_idx" ON "neo"."StudentEnrollment"("courseId", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "StudentEnrollment_userId_courseId_key" ON "neo"."StudentEnrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "StudentElective_subjectId_idx" ON "neo"."StudentElective"("subjectId");

-- CreateIndex
CREATE INDEX "SitePageView_createdAt_idx" ON "neo"."SitePageView"("createdAt");

-- CreateIndex
CREATE INDEX "SitePageView_lastSeen_idx" ON "neo"."SitePageView"("lastSeen");

-- CreateIndex
CREATE INDEX "SitePageView_session_createdAt_idx" ON "neo"."SitePageView"("session", "createdAt");

-- CreateIndex
CREATE INDEX "SitePageView_path_createdAt_idx" ON "neo"."SitePageView"("path", "createdAt");

-- CreateIndex
CREATE INDEX "SitePageView_visitor_createdAt_idx" ON "neo"."SitePageView"("visitor", "createdAt");

-- CreateIndex
CREATE INDEX "SitePageView_clientType_createdAt_idx" ON "neo"."SitePageView"("clientType", "createdAt");

-- CreateIndex
CREATE INDEX "SitePWAEvent_occurredAt_idx" ON "neo"."SitePWAEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "SitePWAEvent_type_occurredAt_idx" ON "neo"."SitePWAEvent"("type", "occurredAt");

-- AddForeignKey
ALTER TABLE "neo"."SuperAdminAuditLog" ADD CONSTRAINT "SuperAdminAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neo"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."Subject" ADD CONSTRAINT "Subject_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "neo"."Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."Subject" ADD CONSTRAINT "Subject_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "neo"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."Resource" ADD CONSTRAINT "Resource_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "neo"."Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."Resource" ADD CONSTRAINT "Resource_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "neo"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."AcademicSession" ADD CONSTRAINT "AcademicSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neo"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."Course" ADD CONSTRAINT "Course_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "neo"."University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."Unit" ADD CONSTRAINT "Unit_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "neo"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."Question" ADD CONSTRAINT "Question_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "neo"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "neo"."AdminAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "neo"."AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neo"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "neo"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."StudentElective" ADD CONSTRAINT "StudentElective_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neo"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neo"."StudentElective" ADD CONSTRAINT "StudentElective_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "neo"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
