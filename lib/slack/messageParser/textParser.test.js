import textParser from './textParser'

describe('textParser', () => {
  // TODO
  it('handles block code syntax', () => {
    expect(textParser('foo ```bar``` baz')).toMatchInlineSnapshot(
      `"foo <pre><code>bar</code></pre> baz"`
    )

    expect(textParser('foo\nbar ```\nbaz```')).toMatchInlineSnapshot(
      `"foo<br>bar <pre><code>baz</code></pre>"`
    )

    expect(textParser('```\nfoo\n```')).toMatchInlineSnapshot(
      `"<pre><code>foo</code></pre>"`
    )
  })

  it('handles inline code syntax', () => {
    expect(textParser('foo `bar` baz')).toMatchInlineSnapshot(
      `"foo <code>bar</code> baz"`
    )

    expect(
      textParser('write `&gt;code&lt;*hello* _world_&gt;/code&lt;`')
    ).toMatchInlineSnapshot(
      `"write <code>&gt;code&lt;&#42;hello&#42; &#95;world&#95;&gt;/code&lt;</code>"`
    )

    expect(textParser('`foo\nbar`')).toMatchInlineSnapshot(`"\`foo<br>bar\`"`)
  })

  it('handles links', () => {
    expect(
      textParser('Why not join <#C024BE7LR|general>?')
    ).toMatchInlineSnapshot(`"Why not join #general?"`)

    expect(
      textParser('Hey <@U024BE7LH>, did you see my file?')
    ).toMatchInlineSnapshot(`"Hey @U024BE7LH, did you see my file?"`)

    expect(
      textParser('This message contains a URL <http://foo.com/>')
    ).toMatchInlineSnapshot(
      `"This message contains a URL <a href=\\"http://foo.com/\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">http://foo.com/</a>"`
    )

    expect(
      textParser('So does this one: <http://www.foo.com|www.foo.com>')
    ).toMatchInlineSnapshot(
      `"So does this one: <a href=\\"http://www.foo.com\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">www.foo.com</a>"`
    )

    expect(textParser('<mailto:bob@example.com|Bob>')).toMatchInlineSnapshot(
      `"<a href=\\"mailto:bob@example.com\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">Bob</a>"`
    )

    expect(textParser('<!channel>')).toMatchInlineSnapshot(`"@channel"`)

    expect(textParser('<!here>')).toMatchInlineSnapshot(`"@here"`)

    expect(textParser('<!everyone>')).toMatchInlineSnapshot(`"@everyone"`)
  })

  it('handles basic formatting syntax', () => {
    // bold
    expect(textParser('what a *bold* statement')).toMatchInlineSnapshot(
      `"what a <strong>bold</strong> statement"`
    )

    // italic
    expect(textParser('_empathize_ with others')).toMatchInlineSnapshot(
      `"<em>empathize</em> with others"`
    )

    // italic (conflict)
    expect(
      textParser('_italic :full_moon_with_face: text_')
    ).toMatchInlineSnapshot(`"<em>italic :full_moon_with_face: text</em>"`)

    // strikethrough
    expect(textParser('correct your ~mistakes~')).toMatchInlineSnapshot(
      `"correct your <s>mistakes</s>"`
    )
  })

  it('handles inline quotes', () => {
    expect(textParser('foo\n&gt;bar')).toMatchInlineSnapshot(
      `"foo<blockquote>bar</blockquote>"`
    )
  })

  it('handles block quotes', () => {
    expect(textParser('&gt;&gt;&gt;foo\nbar')).toMatchInlineSnapshot(
      `"<blockquote>foo<br>bar</blockquote>"`
    )

    expect(textParser('&gt;&gt;&gt; block\n&gt; quote')).toMatchInlineSnapshot(
      `"<blockquote> block<blockquote> quote</blockquote></blockquote>"`
    )
  })

  // TODO
  xit('handles variables', () => {
    expect(textParser('<!channel>')).toMatch('@channel')
    expect(textParser('<!here>')).toMatch('@here')
    expect(textParser('<!everyone>')).toMatch('@everyone')
    expect(textParser('<!subteam^S012345|happy-peeps>')).toMatch('@happy-peeps')
    expect(textParser('<!foo>')).toMatch('<foo>')
    expect(textParser('<!foo|bar>')).toMatch('<bar>')
    expect(textParser('<!foo|bar>')).toMatch('<bar>')
  })

  // TODO
  xit('handles date syntax', () => {
    expect(
      textParser(
        '<!date^1392734382^Posted {date_num} {time_secs}|Posted 2014-02-18 6:39:42 AM>'
      )
    ).toMatch('Posted 2014-02-18 6:39:42 AM')

    expect(
      textParser(
        '<!date^1392734382^{date} at {time}|February 18th, 2014 at 6:39 AM PST>'
      )
    ).toMatch('February 18th, 2014 at 6:39 AM')

    expect(
      textParser(
        '<!date^1392734382^{date_short}^https://example.com/|Feb 18, 2014 PST>'
      )
    ).toMatch('<a href="https://example.com/">Feb 18, 2014</a>')
  })
})
