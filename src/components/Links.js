// @flow strict
import * as React from 'react'

import Heading from './Heading'
import Link from './Link'
import * as UnorderedList from './UnorderedList'

const Chat = () => (
  <section>
    <Heading level="2">Links</Heading>
    <UnorderedList.List>
      <UnorderedList.ListItem>
        <Link href="https://github.com/simonkberg">GitHub</Link>
      </UnorderedList.ListItem>
      <UnorderedList.ListItem>
        <Link href="https://linkedin.com/in/simonkjellberg">LinkedIn</Link>
      </UnorderedList.ListItem>
    </UnorderedList.List>
  </section>
)

export default Chat
