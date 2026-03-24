'use client'

import { useAtom } from 'jotai'
import { Download, Layers, Shield, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import Navbar from '@/components/Navbar'
import { userAtom } from '@/stores/user'
export default function HomePage() {
  const [user] = useAtom(userAtom)

  const isAuthenticated = !!user

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <Navbar isAuthenticated={isAuthenticated} user={user} />

      <main className="flex flex-1 flex-col">
        <Hero isAuthenticated={isAuthenticated} />

        {/* Feature Grid Section */}
        <section className="bg-beige py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-3xl font-bold leading-tight tracking-tighter text-dark md:text-4xl">
              Why Choose Robo Resume?
            </h2>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.15,
                  },
                },
              }}
              className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              <motion.div
                variants={cardVariants}
                className="flex flex-1 flex-col gap-3 rounded-lg border border-yellow bg-yellow p-6"
              >
                <Sparkles className="size-8 text-secondary-accent" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-dark">AI-Powered Suggestions</h3>
                  <p className="text-sm font-normal text-dark/70">
                    Get intelligent recommendations to make your resume shine.
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={cardVariants}
                className="flex flex-1 flex-col gap-3 rounded-lg border border-yellow bg-yellow p-6"
              >
                <Layers className="size-8 text-secondary-accent" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-dark">Professional Templates</h3>
                  <p className="text-sm font-normal text-dark/70">
                    Choose from a variety of expertly designed, modern templates.
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={cardVariants}
                className="flex flex-1 flex-col gap-3 rounded-lg border border-yellow bg-yellow p-6"
              >
                <Download className="size-8 text-secondary-accent" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-dark">Easy PDF Export</h3>
                  <p className="text-sm font-normal text-dark/70">
                    Download your resume in a universally accepted PDF format.
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={cardVariants}
                className="flex flex-1 flex-col gap-3 rounded-lg border border-yellow bg-yellow p-6"
              >
                <Shield className="size-8 text-secondary-accent" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-dark">Secure &amp; Private</h3>
                  <p className="text-sm font-normal text-dark/70">
                    Your data is safe with us and is never shared without permission.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  )
}
