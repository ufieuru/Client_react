import { useSearchParams, useNavigate } from "react-router-dom";
import { searchBooks, toggleLike } from "../lib/books";
import red_hearts from '../Images/red_hearts.png';
import blank_hearts from '../Images/blank_hearts.png';


// (기존 Footer, SearchBar, 이미지 import 등은 유지)

export default function SearchResult() {
  const [params] = useSearchParams();
  const q = params.get("query") || "";
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!q) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const list = await searchBooks(q);
        if (alive) setBooks(list);
      } catch (e) {
        if (alive) setErr(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [q]);

  const onToggleHeart = async (id) => {
    // 낙관적 업데이트
    setBooks(prev => prev.map(b => b.id === id ? ({ ...b, liked: !b.liked }) : b));
    try {
      const current = books.find(b => b.id === id);
      await toggleLike(id, !current?.liked);
    } catch (e) {
      // 실패하면 롤백
      setBooks(prev => prev.map(b => b.id === id ? ({ ...b, liked: !b.liked }) : b));
      console.error("좋아요 실패", e.response?.data || e.message);
    }
  };

  if (loading) return <div style={{padding:'12px 15px'}}>검색 중…</div>;
  if (err) return <div style={{padding:'12px 15px', color:'#c00'}}>오류: {String(err.message || err)}</div>;

  // ↓ 렌더는 기존 카드 마크업 재사용. 하트 onClick만 onToggleHeart로 교체.
  return (
    <section className="book-list">
      {books.map((b) => (
        <div className="book-card" key={b.id}>
          <div className="book-cover">
            <img className="cover-img" src={b.cover} alt={`${b.title} 표지`} />
            <div
              className="heart-icon-wrapper"
              onClick={(e) => { e.stopPropagation(); onToggleHeart(b.id); }}
              role="button"
              aria-label={b.liked ? "좋아요 취소" : "좋아요"}
              title={b.liked ? "좋아요 취소" : "좋아요"}
            >
              <img className="heart-icon" src={b.liked ? red_hearts : blank_hearts} alt="" />
            </div>
          </div>

          <div className="book-info">
            <h2 className="book-title">{b.title}</h2>
            <h3 className="author">{b.author}</h3>
            <h3 className="publisher">{b.publisher}</h3>
            <p className="code">{b.code}</p>
          </div>

          <button className={`loan-btn ${b.status}`} onClick={() => navigate(`/book/${b.id}`)}>
            {b.status === "reserved" ? "예약중" : b.status === "unavailable" ? "불가" : "대출신청"}
          </button>
        </div>
      ))}
    </section>
  );
}
