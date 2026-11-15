"use client"
import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { UserDetailsContext } from '@/context/UserDetailsContext';
import { useUser } from '@clerk/nextjs';

const Provider = ({children} : {children : React.ReactNode}) => {

    const [userDeatials, setuserDeatials] = useState(null)

    const { user, isLoaded } = useUser();

    const CreateNewUser = async () => {
      try {
        const payload = user ? {
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "User",
          email: user.primaryEmailAddress?.emailAddress
        } : {};
        const result = await axios.post("/api/users", payload);
        console.log(result.data);
        setuserDeatials(result.data);
      } catch (err: any) {
        console.error("Error creating/fetching user:", err);
      }
    };

    useEffect(()=>{
        if (isLoaded) {
          CreateNewUser();
        }
    }, [isLoaded, user])
  return (
    <UserDetailsContext.Provider value={{userDeatials, setuserDeatials}}>
        <div>{children}</div>
    </UserDetailsContext.Provider>
  )
}

export default Provider;