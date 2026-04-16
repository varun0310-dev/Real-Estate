import MainSection from "@components/home/MainSection";
import FindPropertiesSection from "../components/home/FindPropertiesSection";
import ExploreLatestArrivals from "../components/home/ExploreLatestArrivals";
import WorkWithUs from "../components/home/WorkWithUs";
import PostYourProperty from "../components/home/PostYourProperty";
import CommercialSpaces from "../components/home/CommercialSpaces";
import FindHome from "../components/home/FindHome";
import PeopleSay from "../components/home/PeopleSay";
import DownloadApp from "../components/home/DownloadApp";



const Home = () => {
  return (
    <div>
      <MainSection />
      <FindPropertiesSection />
      <ExploreLatestArrivals />
      <WorkWithUs />
      <PostYourProperty />
      <CommercialSpaces />
      <FindHome />
      <PeopleSay />
      <DownloadApp />
    </div>

  )
}

export default Home
