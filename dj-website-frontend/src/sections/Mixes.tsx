import { useTranslation } from 'react-i18next'
import styles from './Mixes.module.css'

const youtubeVideos = [
  'https://www.youtube.com/embed/3pKeGlxPikk',
  'https://www.youtube.com/embed/slIsj_NFgG0',
]

const soundcloudTracks = [
  'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/dj_sabi/proudtobeukrainian&color=%230066ff&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false',
  'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/dj_sabi/ahmix&color=%230066ff&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false',
]

const mixcloudMixes = [
  'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=%2Fsabiabdulalieva%2Fsabi-live-playtv-29042015%2F',
  'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=%2Fsabiabdulalieva%2Ffav-songz-mistery-edition%2F',
]

interface Props {
  cookiesAccepted: boolean
}

export default function Mixes({ cookiesAccepted }: Props) {
  const { t } = useTranslation()

  return (
    <section id="mixes" className={styles.mixes}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('mixes.title')}</h2>

        {cookiesAccepted ? (
          <>
            <div className={styles.videoGrid}>
              {youtubeVideos.map((src) => (
                <div key={src} className={styles.videoWrapper}>
                  <iframe
                    src={src}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>

            <div className={styles.audioGrid}>
              {soundcloudTracks.map((src) => (
                <iframe
                  key={src}
                  className={styles.scPlayer}
                  src={src}
                  title="SoundCloud track"
                  allow="autoplay"
                />
              ))}
              {mixcloudMixes.map((src) => (
                <iframe
                  key={src}
                  className={styles.mcPlayer}
                  src={src}
                  title="Mixcloud mix"
                />
              ))}
            </div>
          </>
        ) : (
          <div className={styles.cookieNotice}>
            <p>{t('cookies.message')}</p>
          </div>
        )}
      </div>
    </section>
  )
}
