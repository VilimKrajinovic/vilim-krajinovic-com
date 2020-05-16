import * as React from 'react'
import style from './Hero.module.scss'
import SocialLinks from './SocialLinks'

type Props = {}

const Hero: React.FunctionComponent<Props> = () => {
  return (
    <div className={style.centered}>
      <div className={style.hero}></div>
    </div>
  )
}

export default Hero
