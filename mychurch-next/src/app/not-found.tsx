import Link from "next/link";

export default function NotFound() {
    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Arvo:wght@700&family=Vazirmatn:wght@400;700;900&display=swap');
                .page_404 {
                    padding: 40px 0;
                    background: #fff;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Arvo', serif;
                }
                .four_zero_four_bg {
                    background-image: url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif');
                    height: 400px;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-size: contain;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .four_zero_four_bg h1 {
                    font-size: 80px;
                    font-weight: 900;
                    color: #1a1a2e;
                    margin: 0;
                }
                .contant_box_404 {
                    margin-top: -30px;
                    text-align: center;
                }
                .contant_box_404 h3 {
                    font-size: 26px;
                    font-weight: 700;
                    color: #1a1a2e;
                    margin-bottom: 10px;
                    font-family: 'Vazirmatn', sans-serif;
                }
                .contant_box_404 p {
                    color: #666;
                    font-size: 15px;
                    margin-bottom: 28px;
                    font-family: 'Vazirmatn', sans-serif;
                }
                .link_404 {
                    color: #fff !important;
                    padding: 12px 30px;
                    background: #39ac31;
                    border-radius: 50px;
                    display: inline-block;
                    font-size: 15px;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.3s;
                    font-family: 'Vazirmatn', sans-serif;
                    box-shadow: 0 4px 15px rgba(57,172,49,0.3);
                }
                .link_404:hover {
                    background: #2d8a26;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(57,172,49,0.5);
                }
                .link_worship {
                    color: #6c63ff !important;
                    padding: 10px 24px;
                    border: 2px solid #6c63ff;
                    border-radius: 50px;
                    display: inline-block;
                    font-size: 14px;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.3s;
                    font-family: 'Vazirmatn', sans-serif;
                    margin: 6px;
                }
                .link_worship:hover {
                    background: #6c63ff;
                    color: #fff !important;
                    transform: translateY(-2px);
                }
                .link_bible {
                    color: #d97706 !important;
                    padding: 10px 24px;
                    border: 2px solid #d97706;
                    border-radius: 50px;
                    display: inline-block;
                    font-size: 14px;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.3s;
                    font-family: 'Vazirmatn', sans-serif;
                    margin: 6px;
                }
                .link_bible:hover {
                    background: #d97706;
                    color: #fff !important;
                    transform: translateY(-2px);
                }
                .footer_404 {
                    margin-top: 32px;
                    font-size: 12px;
                    color: #bbb;
                    font-family: 'Vazirmatn', sans-serif;
                }
            `}} />

            <section className="page_404">
                <div style={{ maxWidth: 680, width: "100%", margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
                    <div className="four_zero_four_bg">
                        <h1 className="text-center">404</h1>
                    </div>

                    <div className="contant_box_404">
                        <h3>انگار گم شدید! 😕</h3>
                        <p>
                            صفحه‌ای که دنبالش می‌گردید وجود ندارد یا جابه‌جا شده است.
                            <br />
                            <small style={{ color: "#aaa" }}>The page you are looking for is not available!</small>
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px", marginBottom: "12px" }}>
                            <Link href="/worship" className="link_worship">🎵 سرودها</Link>
                            <Link href="/bible" className="link_bible">📖 کتاب مقدس</Link>
                            <Link href="/" className="link_404">🏠 بازگشت به خانه</Link>
                        </div>
                        <p className="footer_404">MyChurch — Iranian Church of Washington DC</p>
                    </div>
                </div>
            </section>
        </>
    );
}
