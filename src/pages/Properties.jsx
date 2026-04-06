import React from 'react'
import HeaderSection from '../components/Properties/HeaderSection'
import PropertiesMainComp from '../components/Properties/PropertiesMainComp'

const Properties = () => {
  return (
    <div className='md:p-16 bg-gray-100  md:space-y-10 ' >
    <HeaderSection/>
    <PropertiesMainComp/>
    </div>
  )
}

export default Properties
