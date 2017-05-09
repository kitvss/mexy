import crypto from "crypto";

export default function(pas){
	return crypto.createHash("sha256").update(pas).digest("base64");
}