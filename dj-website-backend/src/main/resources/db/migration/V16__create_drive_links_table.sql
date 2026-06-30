CREATE TABLE drive_links (
    id BIGSERIAL PRIMARY KEY,
    link_key VARCHAR(64) NOT NULL UNIQUE,
    url TEXT NOT NULL
);

INSERT INTO drive_links (link_key, url) VALUES
    ('all', 'https://drive.google.com/drive/folders/1oijFYf1d2yIkXEKH4FPvAU2pHLCXdFnC?usp=drive_link'),
    ('videos', 'https://drive.google.com/drive/folders/1-C07PmLCBMsC0qDdPN0il7ztRTyrPpYL?usp=drive_link'),
    ('logo-jpg', 'https://drive.google.com/file/d/1p7F_5byvk_9hpbhPeR83wvIOj_pV1l8S/view?usp=drive_link'),
    ('logo-png', 'https://drive.google.com/file/d/1T6hysXCj5ZKqeRa4T18XXBzoMDJy6NgD/view?usp=drive_link');
