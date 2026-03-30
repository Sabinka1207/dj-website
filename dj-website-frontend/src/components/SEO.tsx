import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

const SEO_DATA: Record<string, { title: string; description: string; lang: string }> = {
  de: {
    title: 'DJ Sabi – DJ buchen Frankfurt | Bar · Club · Festival · Radio',
    description:
      'DJ Sabi – über 15 Jahre Erfahrung, Residentin des Forsage Clubs, internationale Auftritte. Jetzt für Ihre Veranstaltung buchen: Bar, Club, Festival, Radio.',
    lang: 'de',
  },
  en: {
    title: 'DJ Sabi – Book a DJ in Germany | Bar · Club · Festival · Radio',
    description:
      'DJ Sabi – 15+ years experience, Forsage Club resident, international credits including Pacha. Book for your bar, club, festival or radio event in Germany.',
    lang: 'en',
  },
  ua: {
    title: 'DJ Sabi – Замовити DJ у Німеччині | Бар · Клуб · Фестиваль · Радіо',
    description:
      'DJ Sabi – понад 15 років досвіду, резидентка клубу Forsage, виступи на міжнародних майданчиках. Замовте для свого заходу в Німеччині.',
    lang: 'uk',
  },
}

const SITE_URL = 'https://dj-sabi.com'
const OG_IMAGE = `${SITE_URL}/og-image.webp`

const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      name: 'Sabina Abdulaliieva',
      alternateName: 'DJ Sabi',
      url: SITE_URL,
      sameAs: [],
      jobTitle: 'DJ',
      description:
        'DJ with 15+ years of experience, Forsage Club resident, performing in Germany and internationally.',
    },
    {
      '@type': 'MusicGroup',
      name: 'DJ Sabi',
      url: SITE_URL,
      genre: ['Electronic', 'Commercial', 'House', 'Techno', 'RnB', 'Hip-Hop'],
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
