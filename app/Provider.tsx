"use client"
import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { UserDetailsContext } from '@/context/UserDetailsContext';

const Provider = ({children} : {children : React.ReactNode}) => {

    const [userDeatials, setuserDeatials] = useState(null)

    useEffect(()=> {
        CreateNewUser()
    }, [])

    const CreateNewUser = async () => {
        const result = await axios.post('/api/users')
        console.log("userdata",result.data)
        setuserDeatials(result.data)
    }
  return (
    <UserDetailsContext.Provider value={{userDeatials, setuserDeatials}}>
        <div>{children}</div>
    </UserDetailsContext.Provider>
  )
}

export default Provider;