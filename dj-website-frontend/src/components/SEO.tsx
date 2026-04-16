import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

const SEO_DATA: Record<string, { title: string; description: string; lang: string }> = {
  de: {
    title: 'DJ Sabi Frankfurt | DJ buchen – Bar · Club · Festival · Radio',
    description:
      'DJ Sabi – DJ in Frankfurt & Deutschland, über 15 Jahre Erfahrung, Residentin des Forsage Clubs Kiew. Bar, Club, Festival, Radio – jetzt Termin anfragen.',
    lang: 'de',
  },
  en: {
    title: 'DJ Sabi Frankfurt | Book a DJ – Bar · Club · Festival · Radio',
    description:
      'DJ Sabi – Frankfurt-based DJ with 15+ years experience, Forsage Club resident, international credits. Available for bars, clubs, festivals and radio in Germany.',
    lang: 'en',
  },
  ua: {
    title: 'DJ Sabi Франкфурт | Забронювати DJ – Бар · Клуб · Фестиваль · Радіо',
    description:
      'DJ Sabi – діджейка у Франкфурті та Німеччині, понад 15 років досвіду, резидентка клубу Forsage. Бар, клуб, фестиваль, радіо – надішліть запит.',
    lang: 'uk',
  },
}

const SITE_URL = 'https://dj-sabi.com'
const OG_IMAGE = `${SITE_URL}/og-image.jpg`

const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      name: 'Sabina Abdulaliieva',
      alternateName: 'DJ Sabi',
      url: SITE_URL,
      sameAs: [
        'https://www.instagram.com/sabinka_djsabi/',
        'https://www.youtube.com/@Sabinka1207',
        'https://soundcloud.com/dj_sabi',
        'https://www.mixcloud.com/sabiabdulalieva/',
      ],
      jobTitle: 'DJ',
      description:
        'DJ with 15+ years of experience, Forsage Club resident, performing in Germany and internationally.',
    },
    {
      '@type': 'MusicGroup',
      name: 'DJ Sabi',
      url: SITE_URL,
      genre: ['Electronic', 'Commercial', 'House', 'Techno', 'RnB', 'Hip-Hop', 'Ukrainian Music'],
      member: { '@type': 'Person', name: 'Sabina Abdulaliieva' },
    },
  ],
})

export default function SEO() {
  const { i18n } = useTranslation()
  const lang = i18n.language in SEO_DATA ? i18n.language : 'de'
  const { title, description, lang: htmlLang } = SEO_DATA[lang]

  return (
    <Helmet>
      <html lang={htmlLang} />
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={OG_IMAGE} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />

      {/* hreflang */}
      <link rel="alternate" hrefLang="de" href={SITE_URL} />
      <link rel="alternate" hrefLang="en" href={SITE_URL} />
      <link rel="alternate" hrefLang="uk" href={SITE_URL} />
      <link rel="alternate" hrefLang="x-default" href={SITE_URL} />

      {/* Structured data */}
      <script type="application/ld+json">{JSON_LD}</script>
    </Helmet>
  )
}
