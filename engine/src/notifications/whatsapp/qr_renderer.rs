use qrcode::QrCode;
use qrcode::render::unicode;

pub fn print_qr_to_terminal(data: &str) {
    let code = QrCode::new(data).unwrap();
    let image = code.render::<char>()
        .quiet_zone(false)
        .dark_color('█')
        .light_color(' ')
        .build();
    
    println!("\n📸 SCAN THIS QR CODE WITH WHATSAPP:");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("{}", image);
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}
