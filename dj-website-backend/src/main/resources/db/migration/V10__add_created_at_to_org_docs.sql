ALTER TABLE org_docs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

DELETE FROM org_docs
WHERE id NOT IN (
    SELECT MIN(id)
    FROM org_docs
    GROUP BY doc_type, language
);

ALTER TABLE org_docs ADD CONSTRAINT uq_org_docs_type_lang UNIQUE (doc_type, language);
