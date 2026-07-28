#!/usr/bin/env swift

import AppKit
import Foundation

guard CommandLine.arguments.count > 3 else {
    fputs("Usage: render-logistello-frames.swift <source.png> <output-dir> <move>...\n", stderr)
    exit(1)
}

let sourcePath = CommandLine.arguments[1]
let outputDirectory = CommandLine.arguments[2]
let moves = Array(CommandLine.arguments.dropFirst(3))

guard let sourceImage = NSImage(contentsOfFile: sourcePath) else {
    fputs("Unable to read source image: \(sourcePath)\n", stderr)
    exit(1)
}

var proposedRect = NSRect(origin: .zero, size: sourceImage.size)
guard let sourceCGImage = sourceImage.cgImage(forProposedRect: &proposedRect, context: nil, hints: nil) else {
    fputs("Unable to decode source image: \(sourcePath)\n", stderr)
    exit(1)
}

let titleAttributes: [NSAttributedString.Key: Any] = [
    .font: NSFont(name: "Arial Bold", size: 17) ?? NSFont.boldSystemFont(ofSize: 17),
    .foregroundColor: NSColor(calibratedRed: 0.68, green: 0.71, blue: 0.74, alpha: 1),
    .kern: 0
]
let moveAttributes: [NSAttributedString.Key: Any] = [
    .font: NSFont(name: "Arial Bold", size: 30) ?? NSFont.boldSystemFont(ofSize: 30),
    .foregroundColor: NSColor(calibratedRed: 0.96, green: 0.94, blue: 0.90, alpha: 1),
    .kern: 0
]
let positionAttributes: [NSAttributedString.Key: Any] = [
    .font: NSFont(name: "Arial Bold", size: 22) ?? NSFont.boldSystemFont(ofSize: 22),
    .foregroundColor: NSColor(calibratedRed: 0.21, green: 0.72, blue: 0.66, alpha: 1),
    .kern: 0
]

for (index, move) in moves.enumerated() {
    let column = index % 5
    let row = index / 5
    let cropRect = CGRect(x: 11 + column * 132, y: 11 + row * 154, width: 128, height: 128)

    guard let boardCGImage = sourceCGImage.cropping(to: cropRect),
          let bitmap = NSBitmapImageRep(
              bitmapDataPlanes: nil,
              pixelsWide: 528,
              pixelsHigh: 616,
              bitsPerSample: 8,
              samplesPerPixel: 4,
              hasAlpha: true,
              isPlanar: false,
              colorSpaceName: .deviceRGB,
              bytesPerRow: 0,
              bitsPerPixel: 0
          ) else {
        fputs("Unable to render frame \(index + 1)\n", stderr)
        exit(1)
    }

    let context = NSGraphicsContext(bitmapImageRep: bitmap)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    context?.imageInterpolation = .none

    NSColor(calibratedRed: 0.067, green: 0.075, blue: 0.086, alpha: 1).setFill()
    NSRect(x: 0, y: 0, width: 528, height: 616).fill()

    let boardImage = NSImage(cgImage: boardCGImage, size: NSSize(width: 512, height: 512))
    boardImage.draw(in: NSRect(x: 8, y: 96, width: 512, height: 512))

    NSColor(calibratedRed: 0.20, green: 0.23, blue: 0.26, alpha: 1).setStroke()
    let border = NSBezierPath(rect: NSRect(x: 8, y: 96, width: 512, height: 512))
    border.lineWidth = 2
    border.stroke()

    ("LOGISTELLO vs MURAKAMI | GAME 1" as NSString).draw(
        at: NSPoint(x: 24, y: 59),
        withAttributes: titleAttributes
    )
    (move as NSString).draw(at: NSPoint(x: 24, y: 17), withAttributes: moveAttributes)

    let position = String(format: "%02d / %d", index + 1, moves.count) as NSString
    let positionSize = position.size(withAttributes: positionAttributes)
    position.draw(
        at: NSPoint(x: 504 - positionSize.width, y: 21),
        withAttributes: positionAttributes
    )

    NSGraphicsContext.restoreGraphicsState()

    guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
        fputs("Unable to encode frame \(index + 1)\n", stderr)
        exit(1)
    }

    let frameName = String(format: "frame-%02d.png", index + 1)
    let frameURL = URL(fileURLWithPath: outputDirectory).appendingPathComponent(frameName)
    try pngData.write(to: frameURL)
}
