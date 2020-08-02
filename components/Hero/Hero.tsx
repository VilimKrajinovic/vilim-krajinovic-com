import * as React from 'react'
import style from './Hero.module.scss'
import SocialLinks from './SocialLinks'

type Props = {}

const Hero: React.FunctionComponent<Props> = () => {
  return (
    <div className={style.centered}>
      <div className={style.hero}>
        <h1 className={style.header}>Vilim Krajinović</h1>
        <h3 className={style.description}>Software developer</h3>
        <SocialLinks />
      </div>
    </div>
  )
}

export default Hero
