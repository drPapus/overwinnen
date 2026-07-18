export default function Credentials() {
  return (
    <section id="credentials" className="aim-section credentials-section credentials-reveal" aria-labelledby="credentials-title">
      <div className="container">
        <div className="credentials-heading">
          <p className="eyebrow">Professional Credentials</p>
          <h2 id="credentials-title">Education &amp; Certifications</h2>
          <p>My approach combines more than 15 years of practical coaching experience with formal education in medical fitness and movement science. Every recommendation is based on evidence, assessment, and long-term adaptation rather than temporary fixes.</p>
        </div>
        <div className="credentials-layout">
          <figure className="credentials-certificate">
            <img src="/src/assets/images/aaloDiplom.jpg" alt="AALO Medical Fitness Trainer diploma awarded to Anton Klimov" width="1152" height="1536" loading="lazy" />
          </figure>
          <div className="credentials-content">
            <div className="credentials-title-row"><span aria-hidden="true">🏅</span><h3>AALO Certified Medical Fitness Trainer</h3></div>
            <dl className="credentials-meta">
              <div><dt>Completed</dt><dd>June 2026</dd></div>
              <div><dt>Institution</dt><dd>AALO Opleidingen<br /><span>Netherlands</span></dd></div>
            </dl>
            <p className="credentials-description">This certification provides a structured foundation in medical fitness, movement assessment, exercise programming, pain-sensitive training, and evidence-informed coaching.</p>
            <ul className="credentials-features" aria-label="Certification focus areas">
              <li><span aria-hidden="true">✓</span>Medical Fitness</li>
              <li><span aria-hidden="true">✓</span>Functional Assessment</li>
              <li><span aria-hidden="true">✓</span>Exercise Programming</li>
            </ul>
            <a className="btn-secondary credentials-cta" href="#process">View AIM Method <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}
