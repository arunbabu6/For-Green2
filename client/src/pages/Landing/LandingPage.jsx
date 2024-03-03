import Navbar from "../../components/navbar/Navbar";
import Card from "../../components/Card/Card";
import granterData from "../../constants/Granters";
import plantImge2 from "../../assets/plant2.png";
import { IoFolderOpenOutline } from "react-icons/io5";

function LandingPage() {
  return (
    <div className="grid h-screen w-full grid-cols-1 gap-2 bg-neutral-50">
      <div className="h-16 bg-neutral-50">
        <Navbar />
      </div>
      <div className="grid h-auto grid-cols-2 place-items-center gap-8 rounded-xl shadow-md md:ml-36 md:mt-10 md:w-[80%]">
        <div className="rounded-xl">
          <img className="rounded-xl" src={plantImge2} alt="popular-card" />
        </div>
        <div className="mb-[-10] grid grid-rows-2 rounded-xl">
          <div className="p-10">
            <h1 className="mb-4 flex flex-row place-items-center gap-2">
              <IoFolderOpenOutline /> <span>Organization</span>
            </h1>
            <h1 className="font-extrabold">
              Remake - We make architecture exhibition
            </h1>
            <p>
              Remake - We make architecture exhibition social agency in the face
              of urbanization
            </p>
          </div>
          <div className="grid grid-cols-3 place-items-center">
            <div className="w-auto cursor-pointer items-center justify-center rounded-xl p-2 hover:bg-neutral-200">
              <h1>$20,000</h1>
              <p>Raise of $2,000</p>
            </div>
            <div className="w-auto cursor-pointer items-center justify-center rounded-xl p-2 hover:bg-neutral-200">
              <h1>$20,000</h1>
              <p>Raise of $2,000</p>
            </div>
            <div className="w-auto cursor-pointer items-center justify-center rounded-xl p-2 hover:bg-neutral-200">
              <h1>$20,000</h1>
              <p>Raise of $2,000</p>
            </div>
          </div>
        </div>
      </div>
      <div className="row-span-2 grid w-full place-items-center gap-6 bg-neutral-50 p-4 md:row-span-8 md:grid-cols-4 md:p-36">
        {granterData.map((granter) => (
          <Card
            key={granter.id}
            img={granter.img}
            name={granter.name}
            desc={granter.Description}
            rate={granter.Rate}
          />
        ))}
      </div>
      <div className="grid h-20 grid-cols-3 place-items-center rounded-xl bg-neutral-100">
        <div className="copyright">© 2024 Nausicca. All rights reserved.</div>
        <div className="contact">
          Contact us: info@nausicca.com | 000-000-0000
        </div>
        <div className="links">
          <a href="#">About Us</a> | <a href="#">Services</a> |{" "}
          <a href="#">Contact</a>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
