---
title: "Progress Update: ESP32 Controller for Smart Lighting"
pubDate: 2025-05-30
tags: ["hardware", "embedded"]
featured: false
draft: false
author: "Hamish Burke"
---

## Why I’m Building This Project

I enjoy getting cosy in my room with warm, dim orange light for winding down, and having brilliant daylight hues for mornings. My Tapo Wi-Fi lights let me do that via app or voice, but both can be inconvenient. If my phone’s charging in another room or I’m half-asleep in bed, I don’t want to fumble for it or shout at Google Home. I’m building a dedicated, battery-powered remote that feels as intuitive as a wall switch but gives me full control over power, brightness and colour instantly, wherever it sits.

### My Key Goals

- **Portable & Battery-Powered**  
  I want a pocket-sized controller that lives on my desk by day and bedside table by night, without a cable in sight.

- **Ultra-Low Power**  
  By leveraging ESP32 deep-sleep modes and efficient components, I’m aiming for weeks of uptime on a single charge.

- **Immediate Visual Feedback**  
  A 24-LED RGB ring will mirror my lights’ hue and brightness in real time, so every twist or push feels responsive despite API latency.

- **Full Feature Coverage**  
  On/off toggle, fine-grained brightness (0–100%), hue adjustment (0–360°) and a one-tap reset to my favourite warm-white tone.

---

## Current Hardware Setup

Right now I’m prototyping on a breadboard:

- **ESP32 Dev Module**  
  Handles Wi-Fi, deep-sleep logic, state storage and drives the ring LEDs.

- **24-LED RGB Ring**  
  Acts as a live status display: hue maps across 360°, brightness lights a subset of LEDs, ring turns off when lights are off.

- **Rotary Encoder (AiEsp32RotaryEncoder)**  
  Continuous rotation for brightness; push-click toggles power. Boundaries set 0–24 to match ring segments.

- **Arduino Joystick Module**  
  X/Y axes for hue control (converted via `atan2(y, x)` to a 0–360° angle); click resets to warm white.

- **PIR Motion Sensor**  
  Wakes ESP32 from deep sleep when motion is detected; after inactivity it triggers sleep again to save battery.

---

## How the Firmware Works

1. **Deep Sleep & Wake Cycle**  
   - On idle, the ESP32 sleeps with the ring off.  
   - PIR sensor fires → ESP32 wakes → reconnects to Wi-Fi → retrieves last Tapo state from flash → lights up ring instantly.

2. **State Persistence**  
   - Hue, brightness and power status are written to flash memory before sleep.  
   - On wake, I immediately read them back to drive the ring display without waiting for network calls.

3. **LED Ring Mapping**  
   - **Hue**: 360° maps linearly to 24 LEDs (15° per LED).  
   - **Brightness**: each LED ≈4% of total; e.g. 50% brightness lights up 12 LEDs.  
   - **Power**: ring fully off when lights are off, regardless of last hue/brightness.

4. **Input Handling Logic**  
   - **Rotary Encoder**  
     ```cpp
     encoder.setBoundaries(0, 24);
     encVal = encoder.readEncoder();
     brightness = uint8_t(encVal * (100.0 / 24.0));
     ```
     I’m using `update_ring_light(brightness)` immediately, then triggering the API call for the Tapo lights.

   - **Joystick Module**  
     ```cpp
     angle = atan2(y_val - y_center, x_val - x_center) * (180.0 / PI);
     if (angle < 0) angle += 360.0;
     ```
     Pushing the joystick resets to my preconfigured warm-white hue.

---

## Tackling Latency

### Instant Ring Updates  
To satisfy “immediate feedback,” I moved `update_ring_light()` before any network call:

```cpp
if (encVal != prevEncVal) {
    prevEncVal = encVal;
    brightness = encVal;
    update_ring_light(brightness);         // immediate on-device update
    if (!allOn) toggleAll();               // power on if off
    setAllBrightness(brightness);          // Tapo API call
}
```

### Parallel & Asynchronous API Calls

I spun the Tapo controls into a separate thread:

* **Main Thread** reads sensors and updates shared state variables.
* **API Thread** polls these variables and issues non-blocking HTTP calls to both lights in parallel.
* Shared mutex ensures thread-safe access to desired hue, brightness and power flags.

This split means I can dial the knob rapidly and only commit the final value to the network, plus two-lamp updates happen concurrently—cutting perceived latency by roughly 50%.

---

## What I’m Working On Next

1. **PCB Prototype**
   Designing a compact solderable board to replace the breadboard mess and improve reliability.

2. **3D-Printed Inner Shell**
   A minimal PLA frame to hold components snugly and align the joystick, encoder and PIR sensor.

3. **Premium Outer Case**
   Investigating wood veneer or plaster finishes. Something with tactile warmth that complements my desk aesthetic.

4. **UX Tweaks**

   * Calibrating PIR sensitivity and sleep thresholds.
   * Adding a low-battery indicator on the ring.
   * Exploring haptic feedback for button presses.

---

## Prototype Photo

![ESP32 smart lighting controller prototype on breadboard with ring-LED, encoder and joystick](/images/posts/controller-progress.jpg)
