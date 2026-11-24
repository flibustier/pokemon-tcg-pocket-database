import type { APIRoute } from "astro";
import { namesIn, translatedNames } from "../../../lib/data";

export const getStaticPaths = () =>
  [...translatedNames.keys()].map((lang) => ({ params: { lang } }));

export const GET: APIRoute = ({ params }) => new Response(JSON.stringify(namesIn(params.lang!)));
