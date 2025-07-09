
import { NextResponse } from "next/server";

let users = [];

export async function POST(req) {
    const { uid, phoneNumber } = await req.json();

    if (!uid || !phoneNumber) {
        return NextResponse.json({ error: "UID and Phone Number are required" }, { status: 400 });
    }

    const existingUser = users.find(user => user.uid === uid);

    if (existingUser) {
        return NextResponse.json({ message: "User already exists", user: existingUser }, { status: 200 });
    }

    const newUser = {
        uid,
        phoneNumber,
        createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    return NextResponse.json({ message: "User created", user: newUser }, { status: 201 });
}

export async function GET() {
    return NextResponse.json(users);
}
