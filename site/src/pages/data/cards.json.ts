import type { APIRoute } from "astro";
import { cards } from "../../lib/data";
import { pack } from "../../lib/shared";

export const GET: APIRoute = () => new Response(JSON.stringify(cards.map(pack)));
