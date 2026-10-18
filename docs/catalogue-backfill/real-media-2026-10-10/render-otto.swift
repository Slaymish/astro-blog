import SwiftUI
import AppKit
import Observation

// Offline render adapter. No actions, audio, credentials, learning or network.
@Observable final class OttoEngine {
 var journalCards:[JournalCard] = []
 var journalHeader:JournalHeader?
 func requestJournal() {}
 func editCapability(_ id:String,description:String,examples:[String]) {}
 func deleteCapability(_ id:String) {}
}
@main struct Capture {
 @MainActor static func main() throws {
  let args=CommandLine.arguments
  let objects=try JSONSerialization.jsonObject(with:Data(contentsOf:URL(fileURLWithPath:args[1]))) as! [[String:Any]]
  let bridge=OttoEngine()
  bridge.journalCards=objects.map { c in JournalCard(id:c["id"] as! String,description:c["description"] as! String,examples:c["examples"] as! [String],primitive:c["primitive"] as! String,template:(c["template"] as? String ?? ""),origin:"shipped",learnedAt:nil,timesUsed:0,lastUsed:nil,confidence:1) }
  bridge.journalHeader=JournalHeader(capabilities:objects.count,learned:0,commands:0)
  let view=JournalView(bridge:bridge).frame(width:660,height:520).background(Color(nsColor:.windowBackgroundColor)).environment(\.colorScheme,.light)
  _ = NSApplication.shared
  NSApp.appearance = NSAppearance(named:.aqua)
  let host=NSHostingView(rootView:view)
  host.frame=NSRect(x:0,y:0,width:660,height:520)
  let window=NSWindow(contentRect:host.frame,styleMask:[.borderless],backing:.buffered,defer:false)
  window.contentView=host
  host.layoutSubtreeIfNeeded()
  RunLoop.current.run(until:Date(timeIntervalSinceNow:1))
  guard let bitmap=host.bitmapImageRepForCachingDisplay(in:host.bounds) else {fatalError("No bitmap")}
  host.cacheDisplay(in:host.bounds,to:bitmap)
  guard let png=bitmap.representation(using:.png,properties:[:]) else {fatalError("No PNG")}
  try png.write(to:URL(fileURLWithPath:args[2]))
 }
}
