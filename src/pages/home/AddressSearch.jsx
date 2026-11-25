import { useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiMapPin, FiSearch } from 'react-icons/fi';
import './AddressSearch.css';

export default function AddressSearch({
  initialAddress = '',
  saving = false,
  onClose,
  onSelect,
}) {
  const [keyword, setKeyword] = useState(initialAddress);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const searchAddress = (event) => {
    event.preventDefault();
    const query = keyword.trim();
    if (!query) {
      setError('도로명이나 지번 주소를 입력해 주세요.');
      setResults([]);
      return;
    }
    if (!window.kakao?.maps?.services) {
      setError('카카오 주소 검색을 불러오지 못했습니다.');
      return;
    }

    setSearching(true);
    setError('');

    let completedSearches = 0;
    let combinedResults = [];
    let hadError = false;
    const finishSearch = (results, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        combinedResults = [...combinedResults, ...results];
      } else if (status !== window.kakao.maps.services.Status.ZERO_RESULT) {
        hadError = true;
      }

      completedSearches += 1;
      if (completedSearches < 2) return;

      const uniqueResults = Array.from(
        new Map(
          combinedResults.map((result) => [
            `${result.latitude},${result.longitude}`,
            result,
          ]),
        ).values(),
      );
      setResults(uniqueResults);
      setSearching(false);
      if (uniqueResults.length === 0) {
        setError(
          hadError
            ? '검색 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
            : '검색 결과가 없어요. 주소나 장소 이름을 다시 확인해 주세요.',
        );
      }
    };

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(query, (data, status) => {
      const addresses = status === window.kakao.maps.services.Status.OK
        ? data.map((item) => ({
            key: `address-${item.address_name}-${item.x}-${item.y}`,
            kind: 'address',
            title: item.road_address?.address_name || item.address_name,
            address: item.address_name,
            latitude: Number(item.y),
            longitude: Number(item.x),
          }))
        : [];
      finishSearch(addresses, status);
    });

    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(query, (data, status) => {
      const placeResults = status === window.kakao.maps.services.Status.OK
        ? data.map((item) => ({
            key: `place-${item.id}`,
            kind: 'place',
            title: item.place_name,
            address: item.road_address_name || item.address_name,
            latitude: Number(item.y),
            longitude: Number(item.x),
          }))
        : [];
      finishSearch(placeResults, status);
    });
  };

  const selectAddress = (result) => {
    onSelect({
      address: result.address || result.title,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  };

  return (
    <div className="address-search-overlay" role="presentation">
      <section
        className="address-search-page"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-search-title">
        <header className="address-search-header">
          <button
            type="button"
            className="address-search-back"
            aria-label="주소 검색 닫기"
            onClick={onClose}
            disabled={saving}>
            <FiArrowLeft aria-hidden="true" />
          </button>
          <h2 id="address-search-title">주소 검색</h2>
        </header>

        <form className="address-search-form" onSubmit={searchAddress}>
          <FiSearch aria-hidden="true" />
          <input
            ref={inputRef}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="도로명 또는 지번 주소를 입력하세요"
            aria-label="검색할 주소"
            disabled={saving}
          />
          <button type="submit" disabled={searching || saving}>
            {searching ? '검색 중' : '검색'}
          </button>
        </form>

        <p className="address-search-hint">
          도로명 주소나 장소 이름으로 검색할 수 있어요. 선택하면 내 위치로 저장해요.
        </p>

        <div className="address-search-results" aria-live="polite">
          {error && <p className="address-search-message">{error}</p>}
          {!error && results.length === 0 && !searching && (
            <p className="address-search-message">
              예: 서울특별시 중랑구 면목동
            </p>
          )}
          {results.map((result) => (
              <button
                type="button"
                key={result.key}
                className="address-search-result"
                onClick={() => selectAddress(result)}
                disabled={saving}>
                <span className="address-search-result-icon">
                  <FiMapPin aria-hidden="true" />
                </span>
                <span className="address-search-result-text">
                  <strong>{result.title}</strong>
                  {result.address && result.address !== result.title && (
                    <span>{result.address}</span>
                  )}
                </span>
              </button>
          ))}
          {saving && (
            <p className="address-search-message">주소를 저장하고 있어요…</p>
          )}
        </div>
      </section>
    </div>
  );
}
