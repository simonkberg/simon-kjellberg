import React, { PropTypes } from 'react'

const githubLink = {
  title: 'github',
  href: 'https://github.com/simonkberg',
  target: '_blank',
}

const linkedinLink = {
  title: 'linkedin',
  href: 'https://linkedin.com/in/simonkjellberg',
  target: '_blank',
}

const emailLink = {
  title: 'email',
  href: 'mailto:simon.kjellberg@gmail.com',
}

const Link = ({ styles, ...link }) => (
  <small className={styles.linkWrapper}>
      [{link.title}](<a className={styles.link} {...link}>{link.href}</a>)
  </small>
)

Link.propTypes = {
  styles: PropTypes.object,
  title: PropTypes.string,
  href: PropTypes.string,
}

const LandingLinks = ({ styles }) => (
  <div>
    <h2>links</h2>
    <p>
      <Link styles={styles} {...githubLink} />
      <Link styles={styles} {...linkedinLink} />
      <Link styles={styles} {...emailLink} />
    </p>
  </div>
)

LandingLinks.propTypes = {
  styles: PropTypes.object,
}

export default LandingLinks
