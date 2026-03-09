/**
 * Type declarations for Web Bluetooth and WebUSB APIs
 * These are experimental Web APIs used for thermal printer communication.
 */

// ─── Web Bluetooth API ──────────────────────────────────────────────────────

interface BluetoothRequestDeviceFilter {
    services?: BluetoothServiceUUID[]
    name?: string
    namePrefix?: string
}

interface RequestDeviceOptions {
    filters?: BluetoothRequestDeviceFilter[]
    optionalServices?: BluetoothServiceUUID[]
    acceptAllDevices?: boolean
}

type BluetoothServiceUUID = string | number

interface BluetoothRemoteGATTServer {
    device: BluetoothDevice
    connected: boolean
    connect(): Promise<BluetoothRemoteGATTServer>
    disconnect(): void
    getPrimaryService(
        service: BluetoothServiceUUID
    ): Promise<BluetoothRemoteGATTService>
    getPrimaryServices(
        service?: BluetoothServiceUUID
    ): Promise<BluetoothRemoteGATTService[]>
}

interface BluetoothRemoteGATTService {
    device: BluetoothDevice
    uuid: string
    getCharacteristic(
        characteristic: string
    ): Promise<BluetoothRemoteGATTCharacteristic>
    getCharacteristics(
        characteristic?: string
    ): Promise<BluetoothRemoteGATTCharacteristic[]>
}

interface BluetoothCharacteristicProperties {
    broadcast: boolean
    read: boolean
    writeWithoutResponse: boolean
    write: boolean
    notify: boolean
    indicate: boolean
    authenticatedSignedWrites: boolean
    reliableWrite: boolean
    writableAuxiliaries: boolean
}

interface BluetoothRemoteGATTCharacteristic {
    service: BluetoothRemoteGATTService
    uuid: string
    properties: BluetoothCharacteristicProperties
    value: DataView | null
    readValue(): Promise<DataView>
    writeValue(value: BufferSource): Promise<void>
    writeValueWithResponse(value: BufferSource): Promise<void>
    writeValueWithoutResponse(value: BufferSource): Promise<void>
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothDevice extends EventTarget {
    id: string
    name?: string
    gatt?: BluetoothRemoteGATTServer
}

interface Bluetooth extends EventTarget {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>
    getAvailability(): Promise<boolean>
}

// ─── WebUSB API ─────────────────────────────────────────────────────────────

interface USBDeviceFilter {
    vendorId?: number
    productId?: number
    classCode?: number
    subclassCode?: number
    protocolCode?: number
    serialNumber?: string
}

interface USBDeviceRequestOptions {
    filters: USBDeviceFilter[]
}

interface USBEndpoint {
    endpointNumber: number
    direction: "in" | "out"
    type: "bulk" | "interrupt" | "isochronous"
    packetSize: number
}

interface USBAlternateInterface {
    alternateSetting: number
    interfaceClass: number
    interfaceSubclass: number
    interfaceProtocol: number
    interfaceName?: string
    endpoints: USBEndpoint[]
}

interface USBInterface {
    interfaceNumber: number
    alternate: USBAlternateInterface
    alternates: USBAlternateInterface[]
    claimed: boolean
}

interface USBConfiguration {
    configurationValue: number
    configurationName?: string
    interfaces: USBInterface[]
}

interface USBOutTransferResult {
    bytesWritten: number
    status: "ok" | "stall" | "babble"
}

interface USBDevice {
    vendorId: number
    productId: number
    deviceClass: number
    deviceSubclass: number
    deviceProtocol: number
    productName?: string
    manufacturerName?: string
    serialNumber?: string
    configuration: USBConfiguration | null
    configurations: USBConfiguration[]
    opened: boolean
    open(): Promise<void>
    close(): Promise<void>
    selectConfiguration(configurationValue: number): Promise<void>
    claimInterface(interfaceNumber: number): Promise<void>
    releaseInterface(interfaceNumber: number): Promise<void>
    transferOut(
        endpointNumber: number,
        data: BufferSource
    ): Promise<USBOutTransferResult>
}

interface USB extends EventTarget {
    requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>
    getDevices(): Promise<USBDevice[]>
}

// ─── Navigator Extensions ───────────────────────────────────────────────────

interface Navigator {
    bluetooth: Bluetooth
    usb: USB
}
