import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, Printer, Frame, Palette, Truck } from 'lucide-react'
import { publicApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const waitlistSchema = z.object({
  email: z.string().email('Email invalide'),
})

type WaitlistForm = z.infer<typeof waitlistSchema>

const features = [
  {
    icon: Printer,
    title: 'Impression haute qualite',
    description: 'Impressions giclees sur papier fine art ou canvas, avec des encres pigmentaires durables.',
  },
  {
    icon: Frame,
    title: 'Encadrement sur mesure',
    description: 'Large choix de cadres et de finitions pour sublimer vos tirages.',
  },
  {
    icon: Palette,
    title: 'Calibration couleur',
    description: 'Profils ICC personnalises pour une reproduction fidele de vos images.',
  },
  {
    icon: Truck,
    title: 'Livraison soignee',
    description: 'Emballage professionnel et livraison assuree partout en France.',
  },
]

export function Labomaton() {
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistForm>({
    resolver: zodResolver(waitlistSchema),
  })

  const onSubmit = async (data: WaitlistForm) => {
    try {
      setError(null)
      const result = await publicApi.joinWaitlist(data.email, 'labomaton-page')
      setSubmitted(true)
      setMessage(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  return (
    <>
      <Helmet>
        <title>Labomaton - Galerie Cheloudiakoff</title>
        <meta name="description" content="Labomaton - Service d'impression photo haut de gamme par la Galerie Cheloudiakoff. Bientot disponible." />
      </Helmet>

      {/* Hero */}
      <section className="py-24 md:py-32 bg-primary text-primary-foreground">
        <div className="container text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-primary-foreground/10 text-sm font-medium mb-6">
            Bientot disponible
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Labomaton
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Le service d'impression photo haut de gamme de la Galerie Cheloudiakoff.
            Donnez vie a vos images avec une qualite museale.
          </p>

          {/* Waitlist Form */}
          {submitted ? (
            <div className="max-w-md mx-auto">
              <Card className="bg-primary-foreground/10 border-0">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center py-4">
                    <CheckCircle className="h-10 w-10 text-green-400 mb-3" />
                    <p className="text-primary-foreground">{message}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
              <div className="flex gap-2">
                <Input
                  type="email"
                  {...register('email')}
                  placeholder="Votre email"
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                />
                <Button type="submit" variant="secondary" disabled={isSubmitting}>
                  {isSubmitting ? '...' : "S'inscrire"}
                </Button>
              </div>
              {errors.email && (
                <p className="text-sm text-red-300 mt-2">{errors.email.message}</p>
              )}
              {error && (
                <p className="text-sm text-red-300 mt-2">{error}</p>
              )}
              <p className="text-sm text-primary-foreground/60 mt-3">
                Inscrivez-vous pour etre informe du lancement.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-12">
            Ce qui vous attend
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardContent className="pt-6">
                  <feature.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-3xl text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">
            Notre vision
          </h2>
          <p className="text-muted-foreground mb-6">
            Labomaton est ne de notre volonte de rendre accessible l'impression
            photo de qualite museale. En collaboration avec les meilleurs
            laboratoires, nous proposons un service complet allant de la
            preparation de vos fichiers jusqu'a l'encadrement et la livraison.
          </p>
          <p className="text-muted-foreground">
            Que vous soyez photographe professionnel, artiste ou amateur eclaire,
            Labomaton vous accompagne pour donner vie a vos images avec le plus
            grand soin.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container text-center">
          <p className="text-lg text-muted-foreground mb-2">
            Galerie Cheloudiakoff x Labomaton
          </p>
          <p className="text-sm text-muted-foreground">
            Une collaboration dediee a l'excellence de l'image.
          </p>
        </div>
      </section>
    </>
  )
}
