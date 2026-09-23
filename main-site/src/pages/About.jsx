import { useEffect, useRef } from 'react';
import AboutCollage from '../components/AboutCollage';
import './About.css';

function About() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const elements = section.querySelectorAll('.about-reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section className="about" id="about" ref={sectionRef}>

      <div className="about-content">

        {/* Text */}

        <div className="about-text">

          <span className="about-label about-reveal">// ABOUT</span>

          <h2 className="about-reveal">Who we are</h2>

          <p className="about-paragraph about-reveal">
            <strong>CIPHER</strong> is the student association of the
            Department of Computer Science &amp; Engineering. It serves as a
            platform for students to nurture their technical and
            interpersonal skills through innovative and collaborative
            activities. The association strives to bridge the gap between
            academic knowledge and practical application, fostering a
            community of aspiring professionals dedicated to excellence in
            computing.
          </p>

        </div>

        {/* Shuffling photo collage */}

        <div className="about-visual about-reveal">
          <AboutCollage />
        </div>

      </div>

    </section>
  );
}

export default About;
