import React from 'react'
import { assets } from '../assets/assets'
import { Star } from 'lucide-react'

const Login = () => {
  return (
    <div className='min-h-screen flex flex-col md:flex-row'>
      {/* Background Image */}
      <img src={assets.bgImage} alt="" className='absolute top-0 left-0 -z-1 w-full h-full object-cover' />
      {/* left side : Branding */}
      <div className='flex-1 flex flex-col items-start justify-between p-6 md:p-10 lg:pl-40'>
        <img src={assets.logo} alt="" className='h-12 object-contain' />
        <div>
        <div>
        <img src={assets.group_users} alt="" className='h-8 md:h-10'/>
        <div>
          <div>
            {Array(5).fill(0).map((_,i)=>(<Star key={i} className='size-4 md:size-4.5 text-transparent fill-amber-500'/>))}
          </div>
        </div>
        </div>
        </div>
      </div>


    </div>
  )
}

export default Login