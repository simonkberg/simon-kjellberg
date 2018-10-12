// @flow strict
import * as React from 'react'

import Heading from './Heading.bs'
import Link from './Link.bs'
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
