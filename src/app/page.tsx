import Link from 'next/link';
import './landing.css';

export default function LandingPage() {
  return (
    <div className="landing">
      {/* NAV */}
      <nav className="landing-nav">
        <div className="logo">Bid<span>Master</span></div>
        <ul className="nav-links">
          <li><a href="#how">How It Works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#testimonials">Reviews</a></li>
        </ul>
        <div className="nav-actions">
          <Link href="/login" className="nav-login">Log In</Link>
          <a href="#pricing" className="nav-cta">Start Free Trial &rarr;</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">
            <span>&#127959;</span> Built for NY General Contractors
          </div>
          <h1 className="hero-title">
            Win More Bids.<br />
            Waste <em>Zero</em> Time.
          </h1>
          <p className="hero-sub">
            BidMaster replaces email chains and spreadsheets with a smart platform that sends RFQs, collects structured vendor quotes, and lets you compare and select winners in minutes — not days.
          </p>
          <div className="hero-actions">
            <a href="#pricing" className="btn-primary">Start Free Trial &rarr;</a>
            <a href="#how" className="btn-ghost">See how it works &darr;</a>
          </div>
        </div>

        {/* Floating Dashboard */}
        <div className="hero-visual">
          <div className="dashboard-card">
            <div className="card-header">
              <div className="dot r" />
              <div className="dot y" />
              <div className="dot g" />
              <span className="card-title-bar">BidMaster — Kitchen Cabinets · 12 Vendors · 4 Pending</span>
            </div>
            <div className="card-body">
              <div className="table-header">
                <span>Vendor</span>
                <span>Option</span>
                <span>Unit Price</span>
                <span>Delivery</span>
                <span>Status</span>
              </div>

              <div className="table-row winner">
                <span className="supplier-name">&#11088; ManhattanCab Co.</span>
                <span><span className="tag us">US-Made</span></span>
                <span className="price">$4,200</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>6 weeks</span>
                <span><span className="tag win">Winner</span></span>
              </div>

              <div className="table-row">
                <span className="supplier-name">BrooklynMill Supply</span>
                <span><span className="tag us">US-Made</span></span>
                <span className="price">$4,650</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>5 weeks</span>
                <span><span className="tag imp">Reviewed</span></span>
              </div>

              <div className="table-row">
                <span className="supplier-name">TriState Imports</span>
                <span><span className="tag imp">Import</span></span>
                <span className="price">$3,100</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>10 weeks</span>
                <span><span className="tag imp">Reviewed</span></span>
              </div>

              <div className="table-row">
                <span className="supplier-name">Queens Woodcraft</span>
                <span>—</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>—</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>—</span>
                <span><span className="tag pen">Pending</span></span>
              </div>

              <div className="stat-row">
                <div className="stat-box">
                  <div className="stat-label">Bids Received</div>
                  <div className="stat-val">8<span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>/12</span></div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Best Price</div>
                  <div className="stat-val gold">$3,100</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Time Saved</div>
                  <div className="stat-val">14<span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>h</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <div className="logos-strip">
        <span className="logos-label">Trusted by</span>
        <div className="logos-scroll">
          <span className="logo-item">Skanska USA</span>
          <span className="logo-item">Turner Construction</span>
          <span className="logo-item">Related Companies</span>
          <span className="logo-item">Tishman</span>
          <span className="logo-item">Structure Tone</span>
          <span className="logo-item">LiRo Group</span>
          <span className="logo-item">Skanska USA</span>
          <span className="logo-item">Turner Construction</span>
          <span className="logo-item">Related Companies</span>
          <span className="logo-item">Tishman</span>
          <span className="logo-item">Structure Tone</span>
          <span className="logo-item">LiRo Group</span>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="section-label">Process</div>
        <h2 className="section-title">From RFQ to Signed Deal<br />in 4 Steps</h2>
        <p className="section-sub">Stop managing bids in email. BidMaster structures the entire process from first request to final selection.</p>

        <div className="steps-grid">
          <div className="step">
            <div className="step-num">01</div>
            <div className="step-icon">&#128203;</div>
            <h3>Create Your Project</h3>
            <p>Set up a project with categories, custom fields, specs, and deadlines. Upload plans and drawings directly.</p>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <div className="step-icon">&#128232;</div>
            <h3>Send to Vendors</h3>
            <p>Import your vendor list from Excel. Each supplier receives a unique link with all project details — no login needed.</p>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <div className="step-icon">&#128202;</div>
            <h3>Compare in Real-Time</h3>
            <p>As bids come in, compare prices side-by-side. Filter by US-made, delivery time, inclusions, and more.</p>
          </div>
          <div className="step">
            <div className="step-num">04</div>
            <div className="step-icon">&#127942;</div>
            <h3>Select &amp; Notify</h3>
            <p>Pick the winner with one click. BidMaster automatically sends award and regret notices to all vendors.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section features-section" id="features">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything Contractors Need.<br />Nothing They Don&apos;t.</h2>
        <p className="section-sub">Purpose-built for the complexity of large building projects in New York City.</p>

        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">&#127959;</span>
            <h3>Multi-Option Bidding</h3>
            <p>Vendors can submit multiple options (US-made vs. import, with/without installation) — all organized and comparable in one view.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">&#9889;</span>
            <h3>Smart Comparison Dashboard</h3>
            <p>Dynamic table with real-time filtering. Combine any criteria: origin, price range, lead time, inclusions. See the winner instantly.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">&#128193;</span>
            <h3>File &amp; Drawing Attachments</h3>
            <p>Attach PDFs, specs, and plans to any RFQ. Vendors attach samples and certifications to their proposals.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">&#128276;</span>
            <h3>Automated Reminders</h3>
            <p>BidMaster nudges vendors who haven&apos;t responded. You stay focused on the work — not the follow-ups.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">&#128229;</span>
            <h3>Excel Vendor Import</h3>
            <p>Import your entire vendor database in seconds. Assign specific suppliers to specific categories and products.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">&#128274;</span>
            <h3>Secure &amp; Compliant</h3>
            <p>HTTPS, two-factor authentication, role-based permissions. Your bid data and project drawings stay confidential.</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div style={{ textAlign: 'center' }}>
          <div className="section-label">Pricing</div>
          <h2 className="section-title">Simple, Predictable Pricing</h2>
          <p className="section-sub" style={{ margin: '0 auto', textAlign: 'center' }}>One plan. Everything included. No per-seat fees, no hidden charges.</p>
        </div>

        <div className="pricing-wrapper">
          <div className="pricing-card">
            <div className="pricing-plan">Professional Plan</div>
            <div className="pricing-price">
              <span className="price-dollar">$</span>
              <span className="price-num">199</span>
              <span className="price-period">/ month</span>
            </div>
            <p className="pricing-desc">Everything you need to manage bids at scale. Cancel anytime.</p>

            <ul className="pricing-features">
              <li><span className="check">&#10003;</span> Unlimited projects &amp; bid requests</li>
              <li><span className="check">&#10003;</span> Up to 100 vendors per project</li>
              <li><span className="check">&#10003;</span> Multi-option &amp; sub-option bidding</li>
              <li><span className="check">&#10003;</span> Real-time comparison dashboard</li>
              <li><span className="check">&#10003;</span> Automated email reminders</li>
              <li><span className="check">&#10003;</span> Team member access &amp; notifications</li>
              <li><span className="check">&#10003;</span> File uploads (plans, specs, certs)</li>
              <li><span className="check">&#10003;</span> Winner/regret notifications</li>
              <li><span className="check">&#10003;</span> Excel vendor import</li>
              <li><span className="check">&#10003;</span> Priority email support</li>
            </ul>

            <a href="#" className="btn-full">Start Your 14-Day Free Trial &rarr;</a>
            <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.8rem', color: 'var(--muted)' }}>No credit card required to start.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" id="testimonials" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="section-label">Reviews</div>
        <h2 className="section-title">What Contractors Say</h2>

        <div className="testimonials-grid">
          <div className="testimonial">
            <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <q>We used to spend two days just sorting through email quotes for one category. BidMaster cuts that to under an hour. The filtering is a game-changer.</q>
            <div className="testimonial-author">
              <div className="avatar">MR</div>
              <div>
                <div className="author-name">Michael R.</div>
                <div className="author-role">Procurement Director, NYC GC</div>
              </div>
            </div>
          </div>
          <div className="testimonial">
            <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <q>Our vendors actually prefer submitting through BidMaster now — it&apos;s clear, professional, and they know exactly what we need. Bid quality improved significantly.</q>
            <div className="testimonial-author">
              <div className="avatar">ST</div>
              <div>
                <div className="author-name">Sara T.</div>
                <div className="author-role">Project Manager, Manhattan Builder</div>
              </div>
            </div>
          </div>
          <div className="testimonial">
            <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <q>$199/month for the time it saves us is honestly a no-brainer. We recovered that cost within the first week of using it.</q>
            <div className="testimonial-author">
              <div className="avatar">DK</div>
              <div>
                <div className="author-name">David K.</div>
                <div className="author-role">Owner, Brooklyn Construction Group</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="section-label">Get Started</div>
        <h2 className="section-title">Ready to Close Bids Faster?</h2>
        <p className="section-sub">Join hundreds of NY contractors who&apos;ve cut bid management time by 80%.</p>
        <div className="cta-actions">
          <a href="#pricing" className="btn-primary">Start Free Trial — No CC Needed &rarr;</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-left">
          <div className="logo" style={{ fontSize: '1.2rem' }}>Bid<span>Master</span></div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
            <a href="#">Contact</a>
          </div>
        </div>
        <div className="footer-copy">&copy; 2025 BidMaster. All rights reserved.</div>
      </footer>
    </div>
  );
}
