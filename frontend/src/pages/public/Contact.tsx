import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, CheckCircle } from 'lucide-react'
import { publicApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const contactSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caracteres'),
})

type ContactForm = z.infer<typeof contactSchema>

export function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactForm) => {
    try {
      setError(null)
      await publicApi.sendContact(data)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  return (
    <>
      <Helmet>
        <title>Contact - Galerie Cheloudiakoff</title>
        <meta name="description" content="Contactez la Galerie Cheloudiakoff." />
      </Helmet>

      <section className="py-16">
        <div className="container max-w-2xl">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8">Contact</h1>

          {submitted ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Message envoye</h2>
                  <p className="text-muted-foreground">
                    Merci pour votre message. Nous vous repondrons dans les plus brefs delais.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Envoyez-nous un message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Votre nom"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="votre@email.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      {...register('message')}
                      placeholder="Votre message..."
                      rows={6}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message.message}</p>
                    )}
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      'Envoi en cours...'
                    ) : (
                      <>
                        Envoyer
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </>
  )
}
