import { useAtom } from 'jotai'
import { BuilderFormField, NavigationButtons, StepProgress } from '@/components/builder'
import { resumeDataAtom, setResumeDataAtom } from '@/stores/builder'

interface ContactInfoProps {
  onNext: () => void
  onPrevious: () => void
}

export function ContactInfo({ onNext, onPrevious }: ContactInfoProps) {
  const [resumeData] = useAtom(resumeDataAtom)
  const [, setResumeDataPartial] = useAtom(setResumeDataAtom)

  const handleContactChange = (field: keyof typeof resumeData.contactInfo, value: string) => {
    setResumeDataPartial({
      contactInfo: {
        ...resumeData.contactInfo,
        [field]: value,
      },
    })
  }

  return (
    <>
      <StepProgress currentStep={2} totalSteps={7} stepLabel="Contact Info" />
      <div className="flex flex-col gap-8 bg-secondary-bg/50 p-6 md:p-8 rounded-xl border border-border-color/30">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">
            Contact Information
          </h1>
          <p className="text-text-subtle text-base font-normal leading-normal">
            Let's start with the basics. Enter your contact information below.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Row 1: Full Name and Headline */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 min-w-40">
              <BuilderFormField
                id="fullName"
                name="fullName"
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={resumeData.contactInfo.fullName}
                onChange={(e) => handleContactChange('fullName', e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-40">
              <BuilderFormField
                id="headline"
                name="headline"
                label="Headline"
                type="text"
                placeholder="Software Engineer"
                value={resumeData.contactInfo.headline}
                onChange={(e) => handleContactChange('headline', e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Email and Phone */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 min-w-40">
              <BuilderFormField
                id="email"
                name="email"
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={resumeData.contactInfo.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-40">
              <BuilderFormField
                id="phone"
                name="phone"
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={resumeData.contactInfo.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Address (full width) */}
          <div>
            <BuilderFormField
              id="address"
              name="address"
              label="Address"
              type="text"
              placeholder="City, State, Country"
              value={resumeData.contactInfo.address}
              onChange={(e) => handleContactChange('address', e.target.value)}
            />
          </div>

          {/* Row 4: LinkedIn and Website */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 min-w-40">
              <BuilderFormField
                id="linkedin"
                name="linkedin"
                label="LinkedIn Profile"
                type="url"
                placeholder="linkedin.com/in/johndoe"
                value={resumeData.contactInfo.linkedin}
                onChange={(e) => handleContactChange('linkedin', e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-40">
              <BuilderFormField
                id="website"
                name="website"
                label="Website/Portfolio"
                type="url"
                placeholder="johndoe.com"
                value={resumeData.contactInfo.website}
                onChange={(e) => handleContactChange('website', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <NavigationButtons
          onPrevious={onPrevious}
          onNext={onNext}
          previousDisabled={false}
          showPrevious={true}
          showNext={true}
        />
      </div>
    </>
  )
}
