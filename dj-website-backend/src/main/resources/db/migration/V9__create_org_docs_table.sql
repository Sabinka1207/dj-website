CREATE TABLE org_docs (
    id       BIGSERIAL    PRIMARY KEY,
    doc_type VARCHAR(100) NOT NULL,
    language VARCHAR(10)  NOT NULL,
    url      TEXT         NOT NULL
);
