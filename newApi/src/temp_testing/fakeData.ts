import { Lease } from "@src/db/schema";
import { v4 } from "uuid";
import { add } from "date-fns";
import { toUTC } from "@src/shared/utils/date";

export const generateFakeLeases = async () => {
  const leasesToInsert = [...Array(100)].map(_ => {
    const startDate = getRandomDate();
    const state = Math.random() < 0.5 ? "active" : "closed"
    return {
      id: v4(),
      deploymentId: v4(),
      owner: v4(),
      dseq: v4(),
      state,
      price: randomIntFromInterval(1, 10),
      startDate,
      endDate: state !== "active" ? add(startDate, { hours: randomIntFromInterval(1, 48) }) : null
    }
  });

  // console.log(leasesToInsert)

  await Lease.bulkCreate(leasesToInsert);

  const leases = await Lease.findAll({ raw: true });

  console.log("Leases", leases.length);
}

function getRandomDate(offset = 0) {
  return add(toUTC(new Date()), {
    days: -(randomIntFromInterval(2, 20)) + offset
  })
}

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}