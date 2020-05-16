import * as React from 'react'
import Hero from 'components/Hero/Hero'
import style from './Page.module.scss'
import { Scene } from './Hero/Scene'

type Props = {}

const Page: React.FunctionComponent<Props> = () => {
  return (
    <div className={style.page}>
      <Scene />
      <Hero></Hero>
    </div>
  )
}

export default Page
