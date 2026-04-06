import React from 'react'
import DashboardHeaders from '../../components/dashboard/Dashboard/DashboardHeaders'
import PropertiesViews from '../../components/dashboard/Dashboard/PropertiesViews'
import VisitorInsights from '../../components/dashboard/Dashboard/VisitorInsights'
import RecentMessages from '../../components/dashboard/Dashboard/RecentMessages'
const DashboardAllComp = () => {
    return (
        <div className='space-y-3 pt-3' >
            <DashboardHeaders />
            <div className='flex w-[100%] gap-3 ' >
                <div className='w-[55%] space-y-3' >
                    <PropertiesViews />
                    <VisitorInsights />
                </div>
                <div className='w-[45%]' >
                    <RecentMessages />
                </div>
            </div>
        </div>
    )
}

export default DashboardAllComp
