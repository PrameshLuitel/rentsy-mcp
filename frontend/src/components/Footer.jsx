import React from 'react'
import { Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="max-w-[1440px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-ink mb-4">Support</h4>
            <ul className="space-y-3">
              {['Help Centre', 'AirCover', 'Anti-discrimination', 'Disability support', 'Cancellation options', 'Report neighbourhood concern'].map((item) => (
                <li key={item} className="footer-link">{item}</li>
              ))}
            </ul>
          </div>

          {/* Hosting */}
          <div>
            <h4 className="text-sm font-semibold text-ink mb-4">Hosting</h4>
            <ul className="space-y-3">
              {['Rentsy your rental', 'AirCover for Hosts', 'Hosting resources', 'Community forum', 'Responsible hosting'].map((item) => (
                <li key={item} className="footer-link">{item}</li>
              ))}
            </ul>
          </div>

          {/* Rentsy */}
          <div>
            <h4 className="text-sm font-semibold text-ink mb-4">Rentsy</h4>
            <ul className="space-y-3">
              {['Newsroom', 'New features', 'Careers', 'Investors', 'Gift cards', 'Rentsy.org emergencies'].map((item) => (
                <li key={item} className="footer-link">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Legal band */}
      <div className="border-t border-hairline">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-soft">
            © 2026 Rentsy, Inc. · <span className="hover:text-ink cursor-pointer transition-colors">Privacy</span> · <span className="hover:text-ink cursor-pointer transition-colors">Terms</span> · <span className="hover:text-ink cursor-pointer transition-colors">Sitemap</span>
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-soft">
            <span className="flex items-center gap-1 cursor-pointer hover:text-ink transition-colors">
              <Globe className="w-3 h-3" /> English (AU)
            </span>
            <span className="cursor-pointer hover:text-ink transition-colors">$ AUD</span>
            <span className="flex items-center gap-2">
              <span className="cursor-pointer hover:text-ink transition-colors">ⓕ</span>
              <span className="cursor-pointer hover:text-ink transition-colors">𝕏</span>
              <span className="cursor-pointer hover:text-ink transition-colors">📷</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
