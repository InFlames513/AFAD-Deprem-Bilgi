import { Client, GatewayIntentBits, Events, Partials, EmbedBuilder } from "discord.js";
const client = new Client({ intents: Object.values(GatewayIntentBits).filter(x => typeof x === "string"), partials: Object.values(Partials).filter(x => typeof x === "string")});
import got from "got";
import { parse } from "node-html-parser";

client.login("Token");

const getData = async () => {
  const base_url = "https://deprem.afad.gov.tr/last-earthquakes.html";
  let web_data = await got(base_url).text();
  const body = parse(web_data);
  const element = body.querySelector("tbody");
  const text = element.innerHTML;
  const data = text.split("<tr>").map(x => x.replaceAll("<td>", "###").replaceAll("</td>", "").replaceAll("</tr>", "").trim().split("###"))[1].slice(1);
  return {
    "date": Date.parse(data[0])/1000,
    "latitude": Number(data[1]),
    "longitude": Number(data[2]),
    "depth": Number(data[3]),
    "sort": data[4],
    "size": Number(data[5]),
    "location": data[6],
    "earthquake_id": Number(data[7])
  };
};

client.on(Events.ClientReady, async () => {
  try {
    let endEarthquake = Date.now();
    let data = await getData();
    if(!data) return;
    let channel = client.channels.cache.get("kanal id");
    let embed = new EmbedBuilder()
      .setTitle("Son Deprem!")
      .addFields(
          { name: "Zaman:", value: `<t:${data.date}>`, inline: true },
          { name: "Yer:", value: String(data.location), inline: true },
          { name: "Büyüklük:", value: String(data.size), inline: true }
      )
      .setFooter({ text: "Deprem bilgileri AFAD'ın resmi sitesinden alınmaktadır." })
      .setColor("Red")
  
    channel?.send({ embeds: [embed] }).then(() => endEarthquake = Date.now()/1000);
    setInterval(async () => {
      let data = await getData();
      if(!data || data.size < 3.5 || data.date < endEarthquake) return;
      let channel = client.channels.cache.get("kanal id");
      let embed = new EmbedBuilder()
        .setTitle("Yeni Deprem!")
        .addFields(
          { name: "Zaman:", value: `<t:${data.date}>`, inline: true },
          { name: "Yer:", value: String(data.location), inline: true },
          { name: "Büyüklük:", value: String(data.size), inline: true }
        )
        .setFooter({ text: "Deprem bilgileri AFAD'ın resmi sitesinden alınmaktadır." })
        .setColor("Red")
  
      channel?.send({ embeds: [embed] }).then(() => endEarthquake = Date.now()/1000);
    }, 1000 * 60);
  } catch(e) {
    console.log(e);
  }
});
