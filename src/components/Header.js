// @flow strict
import * as React from 'react'
import Link from 'next/link'
import styled from '@emotion/styled'

const Wrapper = styled('header')`
  color: #fff;
  background: #000;
  margin-bottom: 1.45rem;
`

const Container = styled('div')`
  margin: 0 auto;
  max-width: 35rem;
  padding: 1.45rem 1.0875rem;
  padding-top: max(1.45rem, env(safe-area-inset-top));
  padding-left: max(1.0875rem, env(safe-area-inset-left));
  padding-right: max(1.0875rem, env(safe-area-inset-right));
`

const Title = styled('h1')`
  font-size: 1rem;
  font-weight: bold;
  margin: 0;
  text-transform: lowercase;
`

const StyledLink = styled('a')`
  color: #fff;
  text-decoration: none;
`

type Props = {
  siteTitle: string,
}

const Header = ({ siteTitle }: Props) => (
  <Wrapper>
    <Container>
      <Title>
        <Link href="/" passHref>
          <StyledLink>
            #!/
            {siteTitle}
          </StyledLink>
        </Link>
      </Title>
    </Container>
  </Wrapper>
)

export default Header
