BEGIN;
-- Rename the academic site without changing account IDs, content IDs, or relations.
-- Applied migration history remains immutable; this is an additive transition.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM neo."SiteConfig" WHERE site='neocsit')
 AND EXISTS(SELECT 1 FROM neo."SiteConfig" WHERE site='neopathshala') THEN
  RAISE EXCEPTION 'Both old and new site settings exist. Merge settings before applying the brand migration.';
 END IF;
END $$;
ALTER TABLE neo."User" ALTER COLUMN site SET DEFAULT 'neopathshala';
UPDATE neo."User" SET site='neopathshala',"updatedAt"=CURRENT_TIMESTAMP WHERE site='neocsit';
UPDATE neo."SiteConfig" SET site='neopathshala' WHERE site='neocsit';
UPDATE neo."Article" SET site='neopathshala',"updatedAt"=CURRENT_TIMESTAMP WHERE site='neocsit';
UPDATE neo."SiteConfig" SET "siteName"=regexp_replace("siteName",'neocsit','neoPathshala','gi'),
 announcement=regexp_replace(announcement,'neocsit','neoPathshala','gi'),
 "domainUrl"=regexp_replace("domainUrl",'neocsit\.com','neopathshala.com','gi');
UPDATE neo."Article" SET title=regexp_replace(title,'neocsit','neoPathshala','gi'),
 excerpt=regexp_replace(excerpt,'neocsit','neoPathshala','gi'),
 content=regexp_replace(content,'neocsit','neoPathshala','gi'),"updatedAt"=CURRENT_TIMESTAMP
 WHERE title ~* 'neocsit' OR excerpt ~* 'neocsit' OR content ~* 'neocsit';
UPDATE neo."Notice" SET title=regexp_replace(title,'neocsit','neoPathshala','gi'),
 content=regexp_replace(content,'neocsit','neoPathshala','gi'),"updatedAt"=CURRENT_TIMESTAMP
 WHERE title ~* 'neocsit' OR content ~* 'neocsit';
-- Change presentation labels only; never rewrite encrypted settings or private files.
UPDATE neo."PlatformObject" SET body=convert_to(
 regexp_replace(regexp_replace(convert_from(body,'UTF8'),'neocsit\.com','neopathshala.com','gi'),'neocsit','neoPathshala','gi'),'UTF8'),"updatedAt"=CURRENT_TIMESTAMP
 WHERE key='platform:presentation:v1';

COMMIT;
